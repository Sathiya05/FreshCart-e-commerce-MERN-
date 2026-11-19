import { createHmac, timingSafeEqual } from 'node:crypto'
import Razorpay from 'razorpay'
import { ORDER_STATUS_LABELS } from '../constants/order.js'
import { env } from '../config/env.js'
import { Order } from '../models/Order.js'
import { ApiError } from '../utils/apiError.js'
import { serializeOrder } from '../utils/serialize.js'
import { createOrderFromCart } from './order.service.js'

const CAPTURED_EVENTS = new Set(['payment.captured', 'payment.authorized'])
const SUCCESSFUL_PAYMENT_STATUSES = new Set(['captured', 'authorized'])

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

  if (toPaise(payment.amount) !== toPaise(order.totalAmount)) {
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

const markPaid = async (order, paymentId, signature) => {
  if (order.paymentStatus === 'Paid') return order

  if (order.status === 'Cancelled') {
    order.paymentStatus = 'Refunded'
    order.razorpayPaymentId = paymentId
    order.paymentFailureReason =
      'Payment arrived after cancellation. A manual refund is required.'
    await order.save()
    return order
  }

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
})

export const getPaymentConfig = () => ({
  enabled: env.razorpayConfigured,
  keyId: env.razorpayConfigured ? env.razorpayKeyId : '',
  currency: env.razorpayCurrency,
})

export const createRazorpayOrderFromCart = async (userId, payload) => {
  requireRazorpay()
  const order = await createOrderFromCart(
    userId,
    { ...payload, paymentMethod: 'razorpay' },
    { onOrderCreated: createProviderOrder },
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

  if (order.paymentStatus === 'Paid') return serializeOrder(order)

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
  return serializeOrder(order)
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

  if (CAPTURED_EVENTS.has(event.event)) {
    assertPaymentMatchesOrder(order, payment)
    await markPaid(order, payment.id)
    return { processed: true, orderId: String(order._id) }
  }

  if (event.event === 'payment.failed') {
    await markFailed(order, payment.error_description || payment.error_reason)
    return { processed: true, orderId: String(order._id) }
  }

  return { ignored: true }
}
