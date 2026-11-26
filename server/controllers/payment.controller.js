import { env } from '../config/env.js'
import * as paymentService from '../services/payment.service.js'
import { getCart } from '../services/cart.service.js'
import { ApiError } from '../utils/apiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const getPaymentConfig = (_req, res) => {
  res.json({ success: true, data: paymentService.getPaymentConfig() })
}

export const createPaymentOrder = asyncHandler(async (req, res) => {
  const data = await paymentService.createRazorpayOrderFromCart(
    req.user.id,
    req.body,
  )
  res.status(201).json({ success: true, data })
})

// Requested endpoint name. With an addressId it runs the full cart checkout.
// The legacy direct-order form is kept for compatibility, but its amount and
// currency are derived from the server cart so a client cannot choose what it
// will be charged.
export const createPaymentOrderAlias = asyncHandler(async (req, res) => {
  let data
  if (req.body.addressId) {
    data = await paymentService.createRazorpayOrderFromCart(req.user.id, req.body)
  } else {
    const cart = await getCart(req.user.id)
    if (!cart.items.length) {
      throw new ApiError(400, 'Your cart is empty.', 'EMPTY_CART')
    }
    data = await paymentService.createRazorpayOrder({
      amount: Math.round(Number(cart.totalAmount) * 100),
      currency: env.razorpayCurrency,
      receipt: `fc_cart_${Date.now()}`.slice(0, 40),
    })
  }
  res.status(201).json({ success: true, data })
})

export const retryPayment = asyncHandler(async (req, res) => {
  const data = await paymentService.retryRazorpayPayment(
    req.user.id,
    req.params.id,
  )
  res.json({ success: true, data })
})

export const verifyPayment = asyncHandler(async (req, res) => {
  const data = await paymentService.verifyCustomerPayment(req.user.id, req.body)
  res.json({ success: true, data })
})

// Requested endpoint name. An orderId upgrades this to full internal-order
// confirmation; without one it verifies the signed Razorpay response only.
export const verifyPaymentAlias = asyncHandler(async (req, res) => {
  const data = req.body.orderId
    ? await paymentService.verifyCustomerPayment(req.user.id, req.body)
    : paymentService.verifyCheckoutSignature(req.body)
  res.json({ success: true, data })
})

export const refundOrderPayment = asyncHandler(async (req, res) => {
  const data = await paymentService.refundOrderPayment(
    req.params.id,
    req.user.id,
    req.body?.note,
  )
  res.json({ success: true, data })
})

export const handleWebhook = asyncHandler(async (req, res) => {
  const data = await paymentService.processPaymentWebhook(
    req.rawBody,
    req.get('x-razorpay-signature'),
  )
  res.json({ success: true, data })
})
