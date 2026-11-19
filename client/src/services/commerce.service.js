import api from './api.js'
import { normalizeProduct } from './catalog.service.js'
import { DEMO_DELIVERY_SLOTS } from '../data/demoData.js'

/**
 * Phase 4 commerce service: cart, addresses, orders and admin order management.
 * Delivery slots stay as local preview data until a scheduling API exists.
 * Payments remain disabled here; Razorpay is Phase 5.
 */
const getData = (response) => response.data.data

const formatDate = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const normalizeCart = (data = {}) => ({
  ...data,
  items: (data.items || []).map((item) => ({
    ...item,
    product: normalizeProduct(item.product),
  })),
})

const PAYMENT_METHOD_LABELS = {
  cod: 'Cash on delivery',
  razorpay: 'Razorpay',
}

const normalizeOrder = (order = {}) => ({
  ...order,
  date: formatDate(order.date || order.createdAt),
  paymentMethodValue: order.paymentMethod,
  paymentMethod:
    PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod,
  timeline: (order.timeline || []).map((step) => ({
    ...step,
    date: step.date ? formatDate(step.date) : 'Pending',
  })),
})

const normalizeOrderPage = (data = {}) => ({
  ...data,
  items: (data.items || []).map(normalizeOrder),
})

export const getCart = () => api.get('/cart').then(getData).then(normalizeCart)

export const addCartItem = (productId, quantity = 1) =>
  api
    .post('/cart/items', { productId, quantity })
    .then(getData)
    .then(normalizeCart)

export const updateCartItem = (productId, quantity) =>
  api
    .patch(`/cart/items/${encodeURIComponent(productId)}`, { quantity })
    .then(getData)
    .then(normalizeCart)

export const removeCartItem = (productId) =>
  api
    .delete(`/cart/items/${encodeURIComponent(productId)}`)
    .then(getData)
    .then(normalizeCart)

export const clearCartItems = () =>
  api.delete('/cart').then(getData).then(normalizeCart)

export const getAddresses = () => api.get('/account/addresses').then(getData)

export const createAddress = (payload) =>
  api.post('/account/addresses', payload).then(getData)

export const updateAddress = (id, payload) =>
  api.patch(`/account/addresses/${encodeURIComponent(id)}`, payload).then(getData)

export const deleteAddress = (id) =>
  api.delete(`/account/addresses/${encodeURIComponent(id)}`).then(getData)

export const setDefaultAddress = (id) =>
  api.patch(`/account/addresses/${encodeURIComponent(id)}/default`).then(getData)

export const getDeliverySlots = async () => DEMO_DELIVERY_SLOTS

export const createOrder = (payload) =>
  api.post('/orders', payload).then(getData).then(normalizeOrder)

export const getOrders = (params = {}) =>
  api.get('/orders', { params }).then(getData).then(normalizeOrderPage)

export const getOrderById = (id) =>
  api
    .get(`/orders/${encodeURIComponent(id)}`)
    .then(getData)
    .then(normalizeOrder)

export const getOrderTracking = (id) =>
  api
    .get(`/orders/${encodeURIComponent(id)}/track`)
    .then(getData)
    .then(normalizeOrder)

export const getAdminOrders = (params = {}) =>
  api
    .get('/admin/orders', { params: { limit: 60, ...params } })
    .then(getData)
    .then(normalizeOrderPage)

export const getAdminOrder = (id) =>
  api
    .get(`/admin/orders/${encodeURIComponent(id)}`)
    .then(getData)
    .then(normalizeOrder)

export const updateAdminOrderStatus = (id, status) =>
  api
    .patch(`/admin/orders/${encodeURIComponent(id)}/status`, { status })
    .then(getData)
    .then(normalizeOrder)

export const getPaymentConfig = () => api.get('/payments/config').then(getData)

export const createPaymentOrder = (payload) =>
  api.post('/payments/orders', payload).then(getData)

export const retryPayment = (orderId) =>
  api.post(`/payments/orders/${encodeURIComponent(orderId)}/retry`).then(getData)

export const verifyPayment = (payload) =>
  api.post('/payments/verify', payload).then(getData).then(normalizeOrder)
