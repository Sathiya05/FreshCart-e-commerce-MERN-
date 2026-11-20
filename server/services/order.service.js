import { randomBytes } from 'node:crypto'
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUSES,
} from '../constants/order.js'
import { Order } from '../models/Order.js'
import { Product } from '../models/Product.js'
import { User } from '../models/User.js'
import { ApiError } from '../utils/apiError.js'
import { buildPagination, parsePositiveInt } from '../utils/pagination.js'
import { serializeOrder } from '../utils/serialize.js'
import { escapeRegex } from '../utils/slugify.js'
import { clearCart, getCheckoutCart } from './cart.service.js'

const customerPopulation = { path: 'user', select: 'name email' }

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

export const createOrderFromCart = async (userId, payload, options = {}) => {
  const cart = await getCheckoutCart(userId)
  const user = await User.findById(userId)
  if (!user) throw new ApiError(404, 'Account not found.', 'NOT_FOUND')

  const savedAddress = user.addresses.find(
    (address) => String(address._id) === String(payload.addressId),
  )
  if (!savedAddress) {
    throw new ApiError(400, 'Select a valid delivery address.', 'INVALID_ADDRESS')
  }

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

  let order
  try {
    order = await Order.create({
      orderNumber: await generateOrderNumber(),
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
      deliverySlot: payload.deliverySlot || '',
      deliveryInstructions: payload.deliveryInstructions || '',
      timeline: [
        {
          status: 'Pending',
          label: ORDER_STATUS_LABELS.Pending,
          date: new Date(),
        },
      ],
    })
  } catch (error) {
    await restoreStock(items)
    throw error
  }

  // Payment providers are called after the internal order exists but before the
  // cart is cleared, so a provider failure can safely roll the whole intent back.
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

  await clearCart(userId)
  const data = serializeOrder(order)
  if (providerData?.orderId) {
    data.payment = {
      provider: providerData.provider || 'razorpay',
      orderId: providerData.orderId,
    }
  }
  return data
}

const listQuery = (query, extra = {}) => {
  const filter = { ...extra }
  if (query.status && ORDER_STATUSES.includes(query.status)) {
    filter.status = query.status
  }
  if (query.paymentStatus && PAYMENT_STATUSES.includes(query.paymentStatus)) {
    filter.paymentStatus = query.paymentStatus
  }
  return filter
}

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
  const result = await paginate(
    Order,
    listQuery(query, { user: userId }),
    query,
    query.sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 },
  )
  return { ...result, items: result.items.map(serializeOrder) }
}

const findOrder = async (userId, id) => {
  const order = await Order.findOne({ _id: id, user: userId })
  if (!order) throw new ApiError(404, 'Order not found.', 'NOT_FOUND')
  return order
}

export const getUserOrder = async (userId, id) => {
  return serializeOrder(await findOrder(userId, id))
}

export const getOrderTracking = (userId, id) => getUserOrder(userId, id)

export const listAdminOrders = async (query) => {
  const filter = listQuery(query)
  if (query.q) {
    const pattern = new RegExp(escapeRegex(String(query.q).trim()), 'i')
    filter.$or = [{ orderNumber: pattern }, { 'items.name': pattern }]
  }

  const page = parsePositiveInt(query.page, 1, { max: 100000 })
  const limit = parsePositiveInt(query.limit, 10, { max: 60 })
  const rows = await Order.find(filter)
    .populate(customerPopulation)
    .sort(query.sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 })
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

export const updateAdminOrderStatus = async (id, status) => {
  const order = await Order.findById(id)
  if (!order) throw new ApiError(404, 'Order not found.', 'NOT_FOUND')
  if (order.status === status) {
    await order.populate(customerPopulation)
    return serializeOrder(order)
  }

  const previousStatus = order.status

  if (status === 'Cancelled' && previousStatus !== 'Cancelled') {
    await restoreStock(order.items)
    if (order.paymentStatus === 'Paid') order.paymentStatus = 'Refunded'
  } else if (previousStatus === 'Cancelled' && status !== 'Cancelled') {
    await reserveStock(order.items)
    if (order.paymentStatus === 'Refunded') order.paymentStatus = 'Pending'
  }

  if (status === 'Delivered' && order.paymentMethod === 'cod') {
    order.paymentStatus = 'Paid'
  }

  order.status = status
  order.timeline.push({
    status,
    label: ORDER_STATUS_LABELS[status],
    date: new Date(),
  })
  await order.save()
  await order.populate(customerPopulation)

  return serializeOrder(order)
}
