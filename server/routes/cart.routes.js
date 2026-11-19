import { Router } from 'express'
import {
  addCartItem,
  clearCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from '../controllers/cart.controller.js'
import { protect } from '../middleware/auth.js'
import { requireDatabase } from '../middleware/database.js'
import { validate } from '../middleware/validate.js'
import {
  addCartItemValidator,
  cartItemIdValidator,
  updateCartItemValidator,
} from '../validators/cart.validator.js'

const router = Router()

router.use(requireDatabase)
router.use(protect)

router.get('/', getCart)
router.post('/items', addCartItemValidator, validate, addCartItem)
router.patch('/items/:id', updateCartItemValidator, validate, updateCartItem)
router.delete('/items/:id', cartItemIdValidator, validate, removeCartItem)
router.delete('/', clearCart)

export default router
