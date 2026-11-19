import { Router } from 'express'
import {
  createPaymentOrderAlias,
  verifyPaymentAlias,
} from '../controllers/payment.controller.js'
import { protect } from '../middleware/auth.js'
import { requireDatabase } from '../middleware/database.js'
import { validateBadRequest } from '../middleware/validate.js'
import {
  createAliasPaymentOrderValidator,
  verifyAliasPaymentValidator,
} from '../validators/order.validator.js'

const router = Router()

const guarded = [requireDatabase, protect]

router.post(
  '/create-order',
  ...guarded,
  createAliasPaymentOrderValidator,
  validateBadRequest,
  createPaymentOrderAlias,
)
router.post(
  '/verify-payment',
  ...guarded,
  verifyAliasPaymentValidator,
  validateBadRequest,
  verifyPaymentAlias,
)

export default router
