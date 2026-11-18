import { Router } from 'express'
import {
  getCategory,
  listCategories,
} from '../controllers/category.controller.js'
import { requireDatabase } from '../middleware/database.js'

const router = Router()

router.use(requireDatabase)

router.get('/', listCategories)
router.get('/:slug', getCategory)

export default router
