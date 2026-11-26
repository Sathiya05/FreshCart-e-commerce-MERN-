import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import Razorpay from 'razorpay'
import { ORDER_STATUS_LABELS } from '../constants/order.js'
import { env } from '../config/env.js'
import { Order } from '../models/Order.js'
import { ApiError } from '../utils/apiError.js'
import { serializeCustomerOrder, serializeOrder } from '../utils/serialize.js'
import { removePurchasedItemsFromCart } from './cart.service.js'
import { createOrderFromCart } from './order.service.js'

// "Authorized" is not money in the account. Only a captured payment may mark
// an order Paid, whether the update arrives by webhook or by explicit verify.
const CAPTURED_EVENTS = new Set(['payment.captured'])
const SUCCESSFUL_PAYMENT_STATUSES = new Set(['captured'])

const toPaise = (amount) => Math.round(Number(amount) * 100)

const requireRazorpay = () => {
  if (!env.razorpayConfigured) {
    throw new ApiError(
      503,
      'Online payments are not configured on this server.',
      'PAYMENTS_NOT_CONFIGURED',
    )
  }

  return new Razorpay({
    key_id: env.razorpayKeyId,
    key_secret: env.razorpayKeySecret,
  })
}

const signatureMatches = (payload, signature, secret) => {
  if (!payload || !signature || !secret) return false
  const expected = createHmac('sha256', secret).update(payload).digest('hex')
  const expectedBuffer = Buffer.from(expected, 'hex')
  const receivedBuffer = Buffer.from(String(signature), 'hex')
  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  )
}

export const verifyCheckoutSignature = (payload) => {
  const orderId = payload?.razorpay_order_id
  const paymentId = payload?.razorpay_payment_id
  const signature = payload?.razorpay_signature
  const signedPayload = `${orderId}|${paymentId}`

  if (!signatureMatches(signedPayload, signature, env.razorpayKeySecret)) {
    throw new ApiError(
      400,
      'The payment signature could not be verified.',
      'INVALID_PAYMENT_SIGNATURE',
    )
  }

  return { orderId, paymentId, verified: true }
}

const assertPaymentMatchesOrder = (order, payment) => {
  if (String(payment.order_id || '') !== String(order.razorpayOrderId || '')) {
    throw new ApiError(
      400,
      'This payment does not belong to the order.',
      'PAYMENT_ORDER_MISMATCH',
    )
  }

  // Razorpay always reports `payment.amount` in paise. Multiplying it by 100
  // again made every real payment fail this check, leaving orders Pending even
  // after Razorpay captured the money.
  const paidPaise = Math.round(Number(payment.amount))
  const orderPaise = toPaise(order.totalAmount)
  if (!Number.isFinite(paidPaise) || paidPaise !== orderPaise) {
    throw new ApiError(
      400,
      'The paid amount does not match the order total.',
      'PAYMENT_AMOUNT_MISMATCH',
    )
  }

  if (
    String(payment.currency || '').toUpperCase() !==
    env.razorpayCurrency.toUpperCase()
  ) {
    throw new ApiError(
      400,
      'The payment currency does not match this order.',
      'PAYMENT_CURRENCY_MISMATCH',
    )
  }
}

/** Money arrived for an already-cancelled order: refund it, never keep it. */
const refundLatePayment = async (order, paymentId) => {
  order.razorpayPaymentId = paymentId
  let autoRefunded = false
  try {
    const razorpay = requireRazorpay()
    const refund = await razorpay.payments.refund(paymentId, {
      notes: {
        orderId: String(order.id),
        orderNumber: order.orderNumber,
        reason: 'Payment received after cancellation',
      },
    })
    order.razorpayRefundId = refund?.id || ''
    order.razorpayRefundStatus = refund?.status || 'processed'
    autoRefunded = Boolean(refund?.id)
  } catch {
    // Keep the payment id so an admin can retry the refund from the order page.
  }

  order.paymentStatus = 'Refunded'
  order.paymentFailureReason = autoRefunded
    ? 'Payment arrived after cancellation and was refunded automatically.'
    : 'Payment arrived after cancellation. Refund is required; retry it from the admin order page.'
  order.timeline.push({
    status: order.status,
    label: ORDER_STATUS_LABELS[order.status],
    date: new Date(),
    note: order.paymentFailureReason,
  })
  await order.save()
  return order
}

const markPaid = async (order, paymentId, signature) => {
  if (order.status === 'Cancelled' && order.paymentStatus !== 'Paid') {
    return refundLatePayment(order, paymentId)
  }

  // Repeated webhooks/verification calls must still reconcile the cart if a
  // previous attempt saved the Paid flag but failed to update MongoDB.
  if (order.paymentStatus !== 'Paid') {
    order.paymentStatus = 'Paid'
    order.paymentMethod = 'razorpay'
    order.paymentProvider = 'razorpay'
    order.razorpayPaymentId = paymentId
    if (signature) order.razorpaySignature = signature
    order.paymentFailureReason = ''
    order.paidAt = new Date()

    if (order.status === 'Pending') {
      order.status = 'Processing'
      order.timeline.push({
        status: 'Processing',
        label: ORDER_STATUS_LABELS.Processing,
        note: 'Online payment confirmed',
        date: new Date(),
      })
    }
    await order.save()
  }

  // Only now that Razorpay has confirmed the money is the cart reduced. Removing
  // only the purchased products preserves anything added during checkout.
  await removePurchasedItemsFromCart(order.user, order.items)
  return order
}

const markFailed = async (order, reason) => {
  if (order.paymentStatus === 'Paid') return order
  order.paymentStatus = 'Failed'
  order.paymentFailureReason = String(reason || 'Payment failed.').slice(0, 300)
  await order.save()
  return order
}

export const createRazorpayOrder = async ({
  amount,
  currency,
  receipt,
  notes,
}) => {
  const razorpay = requireRazorpay()

  try {
    const payload = {
      amount: Number(amount),
      currency,
      receipt,
    }
    if (notes) payload.notes = notes

    const providerOrder = await razorpay.orders.create(payload)
    if (!providerOrder?.id) {
      throw new Error('Razorpay did not return a payment order ID.')
    }

    return providerOrder
  } catch (error) {
    throw new ApiError(
      500,
      error?.error?.description ||
        error?.message ||
        'Razorpay could not create a payment order.',
      'RAZORPAY_API_ERROR',
    )
  }
}

const createProviderOrder = async (order) => {
  const providerOrder = await createRazorpayOrder({
    amount: toPaise(order.totalAmount),
    currency: env.razorpayCurrency,
    receipt: `fc_${order.orderNumber}`.slice(0, 40),
    notes: {
      orderId: String(order.id),
      orderNumber: order.orderNumber,
    },
  })

  return { provider: 'razorpay', orderId: providerOrder.id }
}

const buildPaymentPayload = (order) => ({
  orderId: order.id,
  orderNumber: order.orderNumber,
  razorpayOrderId: order.razorpayOrderId,
  paymentStatus: order.paymentStatus,
  amount: toPaise(order.totalAmount),
  currency: env.razorpayCurrency,
  keyId: env.razorpayKeyId,
  deliveryDate: order.deliveryDate || '',
  deliverySlot: order.deliverySlot || '',
  deliveryInstructions: order.deliveryInstructions || '',
  addressConfirmedAt: order.addressConfirmedAt || null,
})

export const getPaymentConfig = () => ({
  enabled: env.razorpayConfigured,
  keyId: env.razorpayConfigured ? env.razorpayKeyId : '',
  currency: env.razorpayCurrency,
})

/**
 * Reconcile orders that were paid in Razorpay but stayed Pending because a
 * webhook was missed or an older build rejected the paise amount. Admin-only.
 */
export const syncPendingRazorpayPayments = async () => {
  const razorpay = requireRazorpay()
  const orders = await Order.find({
    paymentMethod: 'razorpay',
    paymentStatus: 'Pending',
    razorpayOrderId: { $nin: ['', null] },
  }).sort({ createdAt: -1 })

  const result = { checked: orders.length, updated: 0, errors: [] }

  for (const order of orders) {
    try {
      const response = await razorpay.orders.fetchPayments(order.razorpayOrderId)
      const payments = response?.items || []
      const successful = payments.find((payment) => {
        if (!SUCCESSFUL_PAYMENT_STATUSES.has(payment?.status)) return false
        try {
          assertPaymentMatchesOrder(order, payment)
          return true
        } catch {
          return false
        }
      })

      if (!successful) continue

      await markPaid(order, successful.id)
      result.updated += 1
    } catch (error) {
      result.errors.push({
        orderId: String(order._id),
        orderNumber: order.orderNumber,
        message: error?.error?.description || error?.message || 'Sync failed',
      })
    }
  }

  return result
}

export const createRazorpayOrderFromCart = async (userId, payload) => {
  requireRazorpay()
  const order = await createOrderFromCart(
    userId,
    { ...payload, paymentMethod: 'razorpay' },
    // The cart must survive a dismissed or failed payment so the customer can
    // retry. markPaid() removes the purchased items after confirmation.
    { onOrderCreated: createProviderOrder, clearCartOnCreate: false },
  )
  return buildPaymentPayload(order)
}

export const retryRazorpayPayment = async (userId, orderId) => {
  requireRazorpay()
  const order = await Order.findOne({ _id: orderId, user: userId })
  if (!order) throw new ApiError(404, 'Order not found.', 'NOT_FOUND')
  if (order.paymentMethod !== 'razorpay') {
    throw new ApiError(
      400,
      'This order was not placed with an online payment.',
      'INVALID_PAYMENT_METHOD',
    )
  }
  if (order.status === 'Cancelled') {
    throw new ApiError(409, 'This order has been cancelled.', 'ORDER_CANCELLED')
  }
  if (!['Pending', 'Failed'].includes(order.paymentStatus)) {
    throw new ApiError(
      409,
      'This order does not need another payment.',
      'PAYMENT_ALREADY_CONFIRMED',
    )
  }

  const provider = await createProviderOrder(order)
  order.paymentProvider = 'razorpay'
  order.razorpayOrderId = provider.orderId
  order.paymentAttempts = (order.paymentAttempts || 0) + 1
  order.paymentFailureReason = ''
  await order.save()

  return buildPaymentPayload(order)
}

/** Claim a refund atomically so a double-click cannot reach Razorpay twice. */
const claimRefund = async (orderId) => {
  const token = randomBytes(16).toString('hex')
  const order = await Order.findOneAndUpdate(
    {
      _id: orderId,
      paymentStatus: { $in: ['Paid', 'Refunded'] },
      razorpayRefundId: { $in: [null, ''] },
      refundRequestToken: { $in: [null, ''] },
    },
    { $set: { refundRequestToken: token } },
    { returnDocument: 'after' },
  )
  return order ? { order, token } : null
}

/** Admin-initiated Razorpay refund. Never trust a client to change this status. */
export const refundOrderPayment = async (orderId, adminId, note = '') => {
  const razorpay = requireRazorpay()
  const existing = await Order.findById(orderId)
  if (!existing) throw new ApiError(404, 'Order not found.', 'NOT_FOUND')
  if (existing.paymentMethod !== 'razorpay' || !existing.razorpayPaymentId) {
    throw new ApiError(
      400,
      'This order has no online payment to refund.',
      'INVALID_PAYMENT_METHOD',
    )
  }
  if (existing.paymentStatus === 'Refunded' && existing.razorpayRefundId) {
    return serializeOrder(existing)
  }
  // A marked-Refunded order with no refund id is a late-payment case where the
  // automatic refund failed. Allow the admin to retry it here.
  if (!['Paid', 'Refunded'].includes(existing.paymentStatus)) {
    throw new ApiError(409, 'Only a paid order can be refunded.', 'PAYMENT_NOT_PAID')
  }

  const claim = await claimRefund(orderId)
  if (!claim) {
    throw new ApiError(
      409,
      'A refund is already in progress or has been processed for this order.',
      'REFUND_IN_PROGRESS',
    )
  }
  const { order, token } = claim

  let refund
  try {
    refund = await razorpay.payments.refund(order.razorpayPaymentId, {
      notes: {
        orderId: String(order.id),
        orderNumber: order.orderNumber,
        requestedBy: String(adminId || ''),
        requestToken: token,
      },
    })
  } catch (error) {
    await Order.updateOne(
      { _id: orderId, refundRequestToken: token },
      { $set: { refundRequestToken: '' } },
    )
    throw new ApiError(
      502,
      error?.error?.description || 'Razorpay could not process the refund.',
      'RAZORPAY_REFUND_FAILED',
    )
  }

  order.razorpayRefundId = refund?.id || order.razorpayRefundId
  order.razorpayRefundStatus = refund?.status || 'processed'
  order.paymentStatus = 'Refunded'
  order.refundRequestToken = ''
  order.timeline.push({
    status: order.status,
    label: ORDER_STATUS_LABELS[order.status],
    date: new Date(),
    note: String(note || `Refund ${refund?.id || ''} processed`).slice(0, 300),
    updatedBy: adminId,
  })

  try {
    await order.save()
  } catch (error) {
    await Order.updateOne(
      { _id: orderId, refundRequestToken: token },
      { $set: { refundRequestToken: '' } },
    )
    throw new ApiError(
      502,
      'The refund was processed but could not be saved. Contact support with the order number.',
      'REFUND_RECORD_FAILED',
    )
  }
  return serializeOrder(order)
}

export const verifyCustomerPayment = async (userId, payload) => {
  const razorpay = requireRazorpay()
  const order = await Order.findOne({ _id: payload.orderId, user: userId })
  if (!order) throw new ApiError(404, 'Order not found.', 'NOT_FOUND')
  if (order.paymentMethod !== 'razorpay') {
    throw new ApiError(
      400,
      'This order does not use an online payment.',
      'INVALID_PAYMENT_METHOD',
    )
  }

  verifyCheckoutSignature(payload)

  if (
    String(payload.razorpay_order_id) !== String(order.razorpayOrderId || '')
  ) {
    throw new ApiError(
      400,
      'This payment does not belong to the order.',
      'PAYMENT_ORDER_MISMATCH',
    )
  }

  if (order.paymentStatus === 'Paid') {
    // A previous attempt may have committed the Paid flag but not the cart
    // cleanup; retry that idempotent step before answering the customer.
    await removePurchasedItemsFromCart(order.user, order.items)
    return serializeCustomerOrder(order)
  }

  let payment
  try {
    payment = await razorpay.payments.fetch(payload.razorpay_payment_id)
  } catch (error) {
    throw new ApiError(
      502,
      'Could not confirm the payment with Razorpay. The webhook will update the order when it arrives.',
      'PAYMENT_LOOKUP_FAILED',
    )
  }

  assertPaymentMatchesOrder(order, payment)
  if (!SUCCESSFUL_PAYMENT_STATUSES.has(payment.status)) {
    throw new ApiError(
      409,
      'Razorpay has not captured this payment yet.',
      'PAYMENT_NOT_CAPTURED',
    )
  }

  await markPaid(order, payload.razorpay_payment_id, payload.razorpay_signature)
  return serializeCustomerOrder(order)
}

export const processPaymentWebhook = async (rawBody, signature) => {
  if (!env.razorpayWebhookSecret) {
    throw new ApiError(
      503,
      'Razorpay webhook secret is not configured.',
      'PAYMENTS_NOT_CONFIGURED',
    )
  }

  const body = rawBody?.toString?.('utf8') || ''
  if (!signatureMatches(body, signature, env.razorpayWebhookSecret)) {
    throw new ApiError(
      400,
      'The webhook signature could not be verified.',
      'INVALID_WEBHOOK_SIGNATURE',
    )
  }

  let event
  try {
    event = JSON.parse(body)
  } catch {
    throw new ApiError(400, 'Invalid webhook payload.', 'INVALID_WEBHOOK_PAYLOAD')
  }

  const payment = event?.payload?.payment?.entity
  if (!payment?.order_id) return { ignored: true }

  const order = await Order.findOne({ razorpayOrderId: payment.order_id })
  if (!order) return { ignored: true }

  // Razorpay retries webhooks. Remember processed event ids so repeated
  // deliveries do not append duplicate timeline entries or repeat refund work.
  if (
    event?.id &&
    (await Order.exists({
      _id: order._id,
      processedWebhookEvents: event.id,
    }))
  ) {
    return { ignored: true, duplicate: true }
  }

  const markProcessed = async () => {
    if (!event?.id) return
    await Order.updateOne(
      { _id: order._id },
      { $addToSet: { processedWebhookEvents: event.id } },
    )
  }

  if (CAPTURED_EVENTS.has(event.event)) {
    assertPaymentMatchesOrder(order, payment)
    await markPaid(order, payment.id)
    await markProcessed()
    return { processed: true, orderId: String(order._id) }
  }

  if (event.event === 'payment.failed') {
    await markFailed(order, payment.error_description || payment.error_reason)
    await markProcessed()
    return { processed: true, orderId: String(order._id) }
  }

  if (event.event.startsWith('refund.')) {
    const refund = event?.payload?.refund?.entity
    if (
      refund?.payment_id &&
      String(refund.payment_id) === String(order.razorpayPaymentId || '')
    ) {
      order.razorpayRefundId = refund.id || order.razorpayRefundId
      order.razorpayRefundStatus = refund.status || order.razorpayRefundStatus
      if (String(refund.status || '').toLowerCase() === 'processed') {
        order.paymentStatus = 'Refunded'
      }
      await order.save()
      await markProcessed()
      return { processed: true, orderId: String(order._id) }
    }
  }

  return { ignored: true }
}
