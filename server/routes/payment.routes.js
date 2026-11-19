import { Router } from 'express'
import {
  createPaymentOrder,
  getPaymentConfig,
  handleWebhook,
  retryPayment,
  verifyPayment,
} from '../controllers/payment.controller.js'
import { protect } from '../middleware/auth.js'
import { requireDatabase } from '../middleware/database.js'
import { validate } from '../middleware/validate.js'
import {
  createPaymentOrderValidator,
  orderIdValidator,
  verifyPaymentValidator,
} from '../validators/order.validator.js'

const router = Router()

router.use(requireDatabase)

// Razorpay calls this without a FreshCart session; the provider signature is
// verified from the raw request body inside the controller.
router.get('/config', getPaymentConfig)
router.post('/webhook', handleWebhook)

router.use(protect)
router.post(
  '/orders',
  createPaymentOrderValidator,
  validate,
  createPaymentOrder,
)
router.post('/verify', verifyPaymentValidator, validate, verifyPayment)
router.post('/orders/:id/retry', orderIdValidator, validate, retryPayment)

export default router
