import {
  DEMO_ADDRESSES,
  DEMO_COUPONS,
  DEMO_DELIVERY_SLOTS,
  DEMO_ORDERS,
} from '../data/demoData.js'

/** PHASE 2 DEMO SERVICE. Replace with real account/order APIs in Phase 4. */
const wait = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms))

export const getDemoProfile = async () => {
  await wait(120)
  return {
    name: 'Santhosh Kumar',
    email: 'santhosh@freshcart.demo',
    phone: '98765 43210',
    joinedOn: '2025-06-14',
  }
}

export const getDemoAddresses = async () => {
  await wait()
  return DEMO_ADDRESSES
}

export const getDemoDeliverySlots = async () => {
  await wait(120)
  return DEMO_DELIVERY_SLOTS
}

export const getDemoOrders = async () => {
  await wait(220)
  return DEMO_ORDERS
}

export const getDemoOrderById = async (id) => {
  await wait(160)
  return DEMO_ORDERS.find((order) => order.id === id) || null
}

/**
 * Demo coupon validation only. Real discount calculation must happen on the
 * backend in Phase 4/5; never trust a client-side discount in production.
 */
export const validateDemoCoupon = async (code, subtotal = 0) => {
  await wait(260)
  const normalizedCode = String(code || '').trim().toUpperCase()
  const coupon = DEMO_COUPONS.find(
    (item) => item.code === normalizedCode && item.isActive,
  )

  if (!coupon) {
    throw new Error('This coupon code is invalid or inactive.')
  }
  if (new Date(coupon.expiryDate) < new Date()) {
    throw new Error('This coupon has expired.')
  }
  if (subtotal < coupon.minimumOrderAmount) {
    throw new Error(`Add items worth more to use ${coupon.code}.`)
  }
  if (coupon.usedCount >= coupon.usageLimit) {
    throw new Error('This coupon has reached its usage limit.')
  }

  const rawDiscount =
    coupon.discountType === 'percent'
      ? (subtotal * coupon.discountValue) / 100
      : coupon.discountValue

  return {
    ...coupon,
    discount: Math.min(Math.round(rawDiscount), coupon.maximumDiscount),
  }
}

export const submitDemoContactForm = async () => {
  await wait(400)
  return { success: true, ticketId: `TKT-${Date.now().toString().slice(-6)}` }
}
