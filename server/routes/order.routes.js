import { Router } from 'express'
import {
  createOrder,
  getMyOrder,
  listMyOrders,
  trackMyOrder,
} from '../controllers/order.controller.js'
import { protect } from '../middleware/auth.js'
import { requireDatabase } from '../middleware/database.js'
import { validate } from '../middleware/validate.js'
import {
  createOrderValidator,
  listOrdersValidator,
  orderIdValidator,
} from '../validators/order.validator.js'

const router = Router()

router.use(requireDatabase)
router.use(protect)

router.post('/', createOrderValidator, validate, createOrder)
router.get('/', listOrdersValidator, validate, listMyOrders)
router.get('/:id/track', orderIdValidator, validate, trackMyOrder)
router.get('/:id', orderIdValidator, validate, getMyOrder)

export default router
