import { Router } from 'express'
import {
  getProduct,
  listProducts,
} from '../controllers/product.controller.js'
import { requireDatabase } from '../middleware/database.js'

const router = Router()

router.use(requireDatabase)

router.get('/', listProducts)
router.get('/:id', getProduct)

export default router
