import { Cart } from '../models/Cart.js'
import { Product } from '../models/Product.js'
import { ApiError } from '../utils/apiError.js'
import { serializeCart } from '../utils/serialize.js'

export const FREE_DELIVERY_THRESHOLD = 499
export const DELIVERY_FEE = 30

const productPopulation = {
  path: 'items.product',
  populate: { path: 'category', select: 'name slug isActive' },
}

const assertAvailable = (product, quantity) => {
  if (!product || !product.isActive) {
    throw new ApiError(400, 'This product is no longer available.', 'PRODUCT_UNAVAILABLE')
  }
  if (product.stock < quantity) {
    throw new ApiError(400, `Only ${product.stock} left in stock.`, 'INSUFFICIENT_STOCK')
  }
}

const withTotals = (data) => {
  const deliveryFee = data.subtotal > 0 && data.subtotal < FREE_DELIVERY_THRESHOLD
    ? DELIVERY_FEE
    : 0

  return {
    ...data,
    deliveryFee,
    deliveryCharge: deliveryFee,
    totalAmount: data.subtotal + deliveryFee,
  }
}

export const getOrCreateCart = async (userId) => {
  const cart = await Cart.findOne({ user: userId })
  if (cart) return cart
  return Cart.create({ user: userId, items: [] })
}

const loadCart = async (userId) => {
  const cart = await getOrCreateCart(userId)
  await cart.populate(productPopulation)
  return withTotals(serializeCart(cart))
}

export const getCart = (userId) => loadCart(userId)

export const addCartItem = async (userId, productId, quantity) => {
  const product = await Product.findById(productId)
  if (!product) throw new ApiError(404, 'Product not found.', 'NOT_FOUND')

  const cart = await getOrCreateCart(userId)
  const existing = cart.items.find(
    (item) => String(item.product) === String(productId),
  )
  const requested = (existing?.quantity || 0) + quantity
  assertAvailable(product, requested)

  if (existing) {
    existing.quantity = requested
  } else {
    cart.items.push({ product: productId, quantity })
  }

  await cart.save()
  return loadCart(userId)
}

export const updateCartItem = async (userId, productId, quantity) => {
  const product = await Product.findById(productId)
  if (!product) throw new ApiError(404, 'Product not found.', 'NOT_FOUND')
  assertAvailable(product, quantity)

  const cart = await getOrCreateCart(userId)
  const item = cart.items.find((entry) => String(entry.product) === String(productId))
  if (!item) throw new ApiError(404, 'Cart item not found.', 'NOT_FOUND')

  item.quantity = quantity
  await cart.save()
  return loadCart(userId)
}

export const removeCartItem = async (userId, productId) => {
  const cart = await getOrCreateCart(userId)
  cart.items = cart.items.filter(
    (item) => String(item.product) !== String(productId),
  )
  await cart.save()
  return loadCart(userId)
}

export const clearCart = async (userId) => {
  const cart = await getOrCreateCart(userId)
  cart.items = []
  await cart.save()
  return loadCart(userId)
}

export const getCheckoutCart = async (userId) => {
  const data = await loadCart(userId)
  if (!data.items.length) {
    throw new ApiError(400, 'Your cart is empty.', 'EMPTY_CART')
  }

  for (const item of data.items) {
    assertAvailable(item.product, item.quantity)
  }

  return data
}
