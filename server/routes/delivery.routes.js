import { Router } from 'express'
import { getDeliverySlots } from '../controllers/delivery.controller.js'
import { requireDatabase } from '../middleware/database.js'

const router = Router()

router.use(requireDatabase)

router.get('/slots', getDeliverySlots)

export default router
