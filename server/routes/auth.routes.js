import { Router } from 'express'
import {
  getMe,
  login,
  logout,
  refresh,
  register,
  updateMe,
} from '../controllers/auth.controller.js'
import { protect } from '../middleware/auth.js'
import { requireDatabase } from '../middleware/database.js'
import { validate } from '../middleware/validate.js'
import {
  loginValidator,
  registerValidator,
  updateProfileValidator,
} from '../validators/auth.validator.js'

const router = Router()

router.use(requireDatabase)

router.post('/register', registerValidator, validate, register)
router.post('/login', loginValidator, validate, login)
router.post('/refresh', refresh)
router.post('/logout', logout)
router.get('/me', protect, getMe)
router.patch('/me', protect, updateProfileValidator, validate, updateMe)

export default router
