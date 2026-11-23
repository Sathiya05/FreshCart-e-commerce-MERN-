import { Router } from 'express'
import { chat, getStatus } from '../controllers/ai.controller.js'
import { optionalAuth } from '../middleware/auth.js'
import { requireDatabase } from '../middleware/database.js'
import { validate } from '../middleware/validate.js'
import { aiChatValidator } from '../validators/ai.validator.js'

const router = Router()

router.use(requireDatabase)

router.get('/status', getStatus)
router.post('/chat', optionalAuth, aiChatValidator, validate, chat)

export default router
