import * as paymentService from '../services/payment.service.js'
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

export const handleWebhook = asyncHandler(async (req, res) => {
  const data = await paymentService.processPaymentWebhook(
    req.rawBody,
    req.get('x-razorpay-signature'),
  )
  res.json({ success: true, data })
})
