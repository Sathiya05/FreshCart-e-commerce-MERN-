import { Router } from 'express'
import {
  getStatus,
  receiveWebhook,
  verifyWebhook,
} from '../controllers/whatsapp.controller.js'
import { requireDatabase } from '../middleware/database.js'

const router = Router()

router.get('/status', getStatus)
router.get('/webhook', verifyWebhook)
router.post('/webhook', requireDatabase, receiveWebhook)

export default router
