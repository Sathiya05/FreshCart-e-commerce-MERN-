import { Router } from 'express'
import {
  getGoogleAuthConfig,
  getMe,
  googleSignIn,
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
  googleAuthValidator,
  loginValidator,
  registerValidator,
  updateProfileValidator,
} from '../validators/auth.validator.js'

const router = Router()

router.use(requireDatabase)

router.post('/register', registerValidator, validate, register)
router.post('/login', loginValidator, validate, login)
router.get('/google/config', getGoogleAuthConfig)
router.post('/google', googleAuthValidator, validate, googleSignIn)
router.post('/refresh', refresh)
router.post('/logout', logout)
router.get('/me', protect, getMe)
router.patch('/me', protect, updateProfileValidator, validate, updateMe)

export default router
