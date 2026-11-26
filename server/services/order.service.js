import { createHash, randomBytes } from 'node:crypto'
import { findDeliverySlot } from '../constants/delivery.js'
import {
  ALLOWED_ORDER_TRANSITIONS,
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
} from '../constants/order.js'
import { Order } from '../models/Order.js'
import { Product } from '../models/Product.js'
import { User } from '../models/User.js'
import { ApiError } from '../utils/apiError.js'
import { buildPagination, parsePositiveInt } from '../utils/pagination.js'
import { serializeCustomerOrder, serializeOrder } from '../utils/serialize.js'
import { escapeRegex } from '../utils/slugify.js'
import { getCheckoutCart, removePurchasedItemsFromCart } from './cart.service.js'

const customerPopulation = { path: 'user', select: 'name email phone' }

const generateOrderNumber = async () => {
  const now = new Date()
  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('')

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const suffix = randomBytes(2).toString('hex').toUpperCase()
    const orderNumber = `FC-${date}-${suffix}`
    const exists = await Order.exists({ orderNumber })
    if (!exists) return orderNumber
  }

  throw new ApiError(500, 'Could not generate a unique order number.', 'ORDER_NUMBER_FAILED')
}

const normalizeIdempotencyKey = (value) =>
  typeof value === 'string' ? value.trim().slice(0, 100) : ''

/**
 * Checkout intent fingerprint. Server prices/cart contents are deliberately
 * excluded: they are authoritative and the cart changes after a COD order is
 * placed, which would otherwise make a legitimate retry look different.
 */
const checkoutRequestHash = (payload) =>
  createHash('sha256')
    .update(
      JSON.stringify({
        addressId: String(payload.addressId || ''),
        paymentMethod: payload.paymentMethod || 'cod',
        deliveryDate: String(payload.deliveryDate || ''),
        deliverySlot: String(payload.deliverySlot || ''),
        deliveryInstructions: String(payload.deliveryInstructions || ''),
        addressConfirmed: payload.addressConfirmed === true,
      }),
    )
    .digest('hex')

const assertSameCheckoutIntent = (order, expectedHash) => {
  if (!order?.idempotencyHash || !expectedHash) return order
  if (order.idempotencyHash !== expectedHash) {
    throw new ApiError(
      409,
      'This idempotency key was already used for different order details. Use a new checkout attempt.',
      'IDEMPOTENCY_KEY_REUSE',
    )
  }
  return order
}

/**
 * Retry on a duplicate order number (or a lost idempotency race) instead of
 * failing the customer. The unique indexes remain the final arbiter.
 */
const createOrderDocument = async (data, expectedHash) => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const order = await Order.create({
        ...data,
        orderNumber: await generateOrderNumber(),
      })
      return { order, existing: false }
    } catch (error) {
      if (error?.code !== 11000) throw error
      if (data.idempotencyKey) {
        const existing = await Order.findOne({
          user: data.user,
          idempotencyKey: data.idempotencyKey,
        })
        if (existing) {
          return {
            order: assertSameCheckoutIntent(existing, expectedHash),
            existing: true,
          }
        }
      }
      if (attempt === 4) throw error
    }
  }

  throw new ApiError(500, 'Could not create your order.', 'ORDER_CREATE_FAILED')
}

const serializeCreatedOrder = (order) => {
  const data = serializeCustomerOrder(order)
  if (order?.razorpayOrderId) {
    data.payment = {
      provider: order.paymentProvider || 'razorpay',
      orderId: order.razorpayOrderId,
    }
  }
  return data
}

const restoreStock = async (items) => {
  for (const item of items) {
    await Product.updateOne(
      { _id: item.product },
      { $inc: { stock: item.quantity } },
    )
  }
}

const reserveStock = async (items) => {
  const reserved = []
  try {
    for (const item of items) {
      const result = await Product.updateOne(
        {
          _id: item.product,
          isActive: true,
          stock: { $gte: item.quantity },
        },
        { $inc: { stock: -item.quantity } },
      )
      if (result.modifiedCount !== 1) {
        throw new ApiError(
          409,
          `${item.name} ran out of stock while placing your order.`,
          'INSUFFICIENT_STOCK',
        )
      }
      reserved.push(item)
    }
    return reserved
  } catch (error) {
    await restoreStock(reserved)
    throw error
  }
}

// Serialize requests that share an idempotency key inside this process. The
// unique partial index is the cross-process guard; this lock closes the window
// between the "already placed?" read and the insert for double-clicks/retries.
const checkoutLocks = new Map()

const withCheckoutLock = async (key, task) => {
  if (!key) return task()
  const previous = checkoutLocks.get(key) || Promise.resolve()
  let release
  const gate = new Promise((resolve) => {
    release = resolve
  })
  const chain = previous.then(() => gate)
  checkoutLocks.set(key, chain)
  await previous
  try {
    return await task()
  } finally {
    release()
    if (checkoutLocks.get(key) === chain) checkoutLocks.delete(key)
  }
}

const createOrderFromCartUnlocked = async (userId, payload, options = {}) => {
  // A double-click or a retried request must never create a second order.
  const idempotencyKey = normalizeIdempotencyKey(payload.idempotencyKey)
  const idempotencyHash = idempotencyKey ? checkoutRequestHash(payload) : ''
  if (idempotencyKey) {
    const existing = await Order.findOne({ user: userId, idempotencyKey })
    if (existing) {
      return serializeCreatedOrder(assertSameCheckoutIntent(existing, idempotencyHash))
    }
  }

  const cart = await getCheckoutCart(userId)
  const user = await User.findById(userId)
  if (!user) throw new ApiError(404, 'Account not found.', 'NOT_FOUND')

  const savedAddress = user.addresses.find(
    (address) => String(address._id) === String(payload.addressId),
  )
  if (!savedAddress) {
    throw new ApiError(400, 'Select a valid delivery address.', 'INVALID_ADDRESS')
  }

  if (payload.addressConfirmed !== true) {
    throw new ApiError(400, 'Confirm your delivery address.', 'ADDRESS_NOT_CONFIRMED')
  }

  const deliverySlot = findDeliverySlot(
    payload.deliveryDate,
    payload.deliverySlot,
  )
  if (!deliverySlot) {
    throw new ApiError(400, 'Select an available delivery date and slot.', 'INVALID_DELIVERY_SLOT')
  }

  // Prices, names, SKUs and images are snapshotted from the server cart. Client
  // supplied amounts are never accepted anywhere in this path.
  const items = cart.items.map((item) => ({
    product: item.product.id,
    name: item.product.name,
    sku: item.product.sku || '',
    unit: item.product.unit || 'pcs',
    image: item.product.images?.[0] || '',
    price: item.unitPrice,
    quantity: item.quantity,
    lineTotal: item.lineTotal,
  }))

  await reserveStock(items)

  const orderData = {
    user: userId,
    items,
    shippingAddress: {
      label: savedAddress.label || 'Home',
      fullName: savedAddress.fullName,
      phone: savedAddress.phone,
      addressLine: savedAddress.addressLine,
      city: savedAddress.city,
      state: savedAddress.state,
      pincode: savedAddress.pincode,
    },
    status: 'Pending',
    paymentMethod: payload.paymentMethod || 'cod',
    paymentStatus: 'Pending',
    subtotal: cart.subtotal,
    discount: 0,
    deliveryFee: cart.deliveryFee,
    totalAmount: cart.totalAmount,
    deliveryDate: deliverySlot.date,
    deliverySlot: deliverySlot.label,
    deliveryInstructions: payload.deliveryInstructions || '',
    addressConfirmedAt: new Date(),
    timeline: [
      {
        status: 'Pending',
        label: ORDER_STATUS_LABELS.Pending,
        date: new Date(),
      },
    ],
  }
  if (idempotencyKey) {
    orderData.idempotencyKey = idempotencyKey
    orderData.idempotencyHash = idempotencyHash
  }

  let order
  try {
    const result = await createOrderDocument(orderData, idempotencyHash)
    if (result.existing) {
      await restoreStock(items)
      return serializeCreatedOrder(result.order)
    }
    order = result.order
  } catch (error) {
    await restoreStock(items)
    throw error
  }

  // Provider orders are created after the internal order exists. The cart is
  // intentionally left untouched here: online payments are only deducted from
  // the cart once Razorpay confirms the money (see payment.service.markPaid).
  let providerData = null
  if (options.onOrderCreated) {
    try {
      providerData = await options.onOrderCreated(order)
      if (providerData?.orderId) {
        order.paymentProvider = providerData.provider || 'razorpay'
        order.razorpayOrderId = providerData.orderId
        order.paymentAttempts = 1
        await order.save()
      }
    } catch (error) {
      await restoreStock(items)
      await Order.deleteOne({ _id: order._id })
      throw error
    }
  }

  if (options.clearCartOnCreate !== false) {
    // COD orders are confirmed immediately; remove only what was purchased so
    // unrelated items added during checkout are preserved.
    await removePurchasedItemsFromCart(userId, items)
  }

  return serializeCreatedOrder(order)
}

export const createOrderFromCart = (userId, payload, options = {}) => {
  const key = normalizeIdempotencyKey(payload.idempotencyKey)
  return withCheckoutLock(
    key ? `${String(userId)}:${key}` : '',
    () => createOrderFromCartUnlocked(userId, payload, options),
  )
}

const listQuery = (query, extra = {}) => {
  const filter = { ...extra }
  if (query.status) {
    const requested = String(query.status)
      .split(',')
      .map((status) => status.trim())
      .filter((status) => ORDER_STATUSES.includes(status))
    if (requested.length === 1) filter.status = requested[0]
    if (requested.length > 1) filter.status = { $in: requested }
  }
  if (query.paymentStatus && PAYMENT_STATUSES.includes(query.paymentStatus)) {
    filter.paymentStatus = query.paymentStatus
  }
  if (query.paymentMethod && PAYMENT_METHODS.includes(query.paymentMethod)) {
    filter.paymentMethod = query.paymentMethod
  }
  return filter
}

const dateRangeFilter = (query) => {
  const range = {}
  if (query.from) {
    const from = new Date(query.from)
    if (!Number.isNaN(from.getTime())) range.$gte = from
  }
  if (query.to) {
    const to = new Date(query.to)
    if (!Number.isNaN(to.getTime())) {
      to.setHours(23, 59, 59, 999)
      range.$lte = to
    }
  }
  return range
}

const orderSort = (query) =>
  query.sort === 'oldest'
    ? { createdAt: 1 }
    : query.sort === 'total'
      ? { totalAmount: -1 }
      : { createdAt: -1 }

const paginate = async (Model, filter, query, sort) => {
  const page = parsePositiveInt(query.page, 1, { max: 100000 })
  const limit = parsePositiveInt(query.limit, 10, { max: 60 })
  const items = await Model.find(filter)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean()
  const total = await Model.countDocuments(filter)
  return { items, ...buildPagination(total, page, limit) }
}

export const listUserOrders = async (userId, query) => {
  const filter = listQuery(query, { user: userId })
  const range = dateRangeFilter(query)
  if (Object.keys(range).length) filter.createdAt = range

  const result = await paginate(Order, filter, query, orderSort(query))
  return { ...result, items: result.items.map(serializeCustomerOrder) }
}

const findOrder = async (userId, id) => {
  const order = await Order.findOne({ _id: id, user: userId })
  if (!order) throw new ApiError(404, 'Order not found.', 'NOT_FOUND')
  return order
}

export const getUserOrder = async (userId, id) => {
  return serializeCustomerOrder(await findOrder(userId, id))
}

/** Safe lookup by Mongo ID or customer-facing order number, scoped to one user. */
export const getCustomerOrderByIdentifier = async (userId, identifier) => {
  const value = String(identifier || '').trim()
  if (!value) throw new ApiError(400, 'An order identifier is required.', 'INVALID_ORDER')

  const isObjectId = /^[a-fA-F0-9]{24}$/.test(value)
  const order = await Order.findOne(
    isObjectId
      ? { _id: value, user: userId }
      : { orderNumber: value.toUpperCase(), user: userId },
  )
  if (!order) throw new ApiError(404, 'Order not found.', 'NOT_FOUND')

  return serializeCustomerOrder(order)
}

export const getOrderTracking = (userId, id) => getUserOrder(userId, id)

export const listAdminOrders = async (query) => {
  const filter = listQuery(query)
  const range = dateRangeFilter(query)
  if (Object.keys(range).length) filter.createdAt = range

  if (query.q) {
    const pattern = new RegExp(escapeRegex(String(query.q).trim()), 'i')
    // Customer identity lives on User, so resolve matching accounts first and
    // combine them with the denormalised order fields in one query.
    const matchingUsers = await User.find({
      $or: [{ name: pattern }, { email: pattern }, { phone: pattern }],
    })
      .select('_id')
      .lean()
    filter.$or = [
      { orderNumber: pattern },
      { 'items.name': pattern },
      { 'items.sku': pattern },
      { 'shippingAddress.fullName': pattern },
      { 'shippingAddress.phone': pattern },
      { user: { $in: matchingUsers.map((entry) => entry._id) } },
    ]
  }

  const page = parsePositiveInt(query.page, 1, { max: 100000 })
  const limit = parsePositiveInt(query.limit, 10, { max: 60 })
  const rows = await Order.find(filter)
    .populate(customerPopulation)
    .sort(orderSort(query))
    .skip((page - 1) * limit)
    .limit(limit)
    .lean()
  const total = await Order.countDocuments(filter)

  return {
    items: rows.map(serializeOrder),
    ...buildPagination(total, page, limit),
  }
}

export const getAdminOrder = async (id) => {
  const order = await Order.findById(id).populate(customerPopulation)
  if (!order) throw new ApiError(404, 'Order not found.', 'NOT_FOUND')
  return serializeOrder(order)
}

const settleOrder = async (order) => {
  await order.populate(customerPopulation)
  return serializeOrder(order)
}

export const updateAdminOrderStatus = async (
  id,
  status,
  { note = '', adminId } = {},
) => {
  const order = await Order.findById(id)
  if (!order) throw new ApiError(404, 'Order not found.', 'NOT_FOUND')

  const cleanNote = String(note || '').trim().slice(0, 300)
  const timelineEvent = {
    status,
    label: ORDER_STATUS_LABELS[status],
    date: new Date(),
    note: cleanNote,
    updatedBy: adminId,
  }

  if (order.status === status) {
    // Same status can still carry a new admin note.
    if (cleanNote) {
      order.timeline.push(timelineEvent)
      await order.save()
    }
    return settleOrder(order)
  }

  const previousStatus = order.status
  const allowed = ALLOWED_ORDER_TRANSITIONS[previousStatus] || []
  if (!allowed.includes(status)) {
    throw new ApiError(
      409,
      `Cannot change an order from "${previousStatus}" to "${status}".`,
      'INVALID_STATUS_TRANSITION',
    )
  }

  if (status === 'Cancelled') {
    if (
      order.paymentMethod === 'razorpay' &&
      order.paymentStatus === 'Paid' &&
      !order.razorpayRefundId
    ) {
      throw new ApiError(
        409,
        'Refund the online payment before cancelling this order.',
        'REFUND_REQUIRED',
      )
    }
    await restoreStock(order.items)
    if (order.paymentStatus === 'Paid') {
      order.paymentStatus = 'Refunded'
      timelineEvent.note =
        timelineEvent.note || 'Paid order cancelled; refund/cash return required.'
    }
    if (order.paymentMethod === 'cod') {
      order.paymentConfirmedAt = null
      order.paymentConfirmedBy = null
    }
  } else if (previousStatus === 'Cancelled') {
    await reserveStock(order.items)
    if (order.paymentStatus === 'Refunded') order.paymentStatus = 'Pending'
  }

  // Delivery no longer silently marks COD as paid. Cash collection is an
  // explicit, audited admin action (confirmCodPayment).
  order.status = status
  order.timeline.push(timelineEvent)
  await order.save()
  return settleOrder(order)
}

/** Admin confirmation that cash was actually collected for a COD order. */
export const confirmCodPayment = async (id, adminId) => {
  const order = await Order.findById(id)
  if (!order) throw new ApiError(404, 'Order not found.', 'NOT_FOUND')
  if (order.paymentMethod !== 'cod') {
    throw new ApiError(
      400,
      'Only cash-on-delivery orders can be confirmed manually.',
      'INVALID_PAYMENT_METHOD',
    )
  }
  if (order.status === 'Cancelled') {
    throw new ApiError(409, 'This order has been cancelled.', 'ORDER_CANCELLED')
  }
  if (!['Out for delivery', 'Delivered'].includes(order.status)) {
    throw new ApiError(
      409,
      'Cash can only be confirmed once the order is out for delivery or delivered.',
      'ORDER_NOT_READY_FOR_COLLECTION',
    )
  }
  if (order.paymentStatus !== 'Paid') {
    order.paymentStatus = 'Paid'
    order.paymentConfirmedAt = new Date()
    order.paymentConfirmedBy = adminId
    order.timeline.push({
      status: order.status,
      label: ORDER_STATUS_LABELS[order.status],
      date: new Date(),
      note: 'Cash collection confirmed by admin',
      updatedBy: adminId,
    })
    await order.save()
  }
  return settleOrder(order)
}
