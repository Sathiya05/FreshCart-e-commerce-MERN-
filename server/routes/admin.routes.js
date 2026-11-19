import { Router } from 'express'
import { getOverview } from '../controllers/admin.controller.js'
import {
  createCategory,
  deleteCategory,
  listAdminCategories,
  updateCategory,
} from '../controllers/category.controller.js'
import {
  getAdminOrder,
  listAdminOrders,
  updateAdminOrderStatus,
} from '../controllers/order.controller.js'
import {
  createProduct,
  deleteProduct,
  getAdminProduct,
  listAdminProducts,
  updateProduct,
} from '../controllers/product.controller.js'
import { authorize, protect } from '../middleware/auth.js'
import { requireDatabase } from '../middleware/database.js'
import { validate } from '../middleware/validate.js'
import {
  categoryIdValidator,
  createCategoryValidator,
  createProductValidator,
  productIdValidator,
  updateCategoryValidator,
  updateProductValidator,
} from '../validators/catalog.validator.js'
import {
  orderIdValidator,
  updateOrderStatusValidator,
} from '../validators/order.validator.js'
import { createUploadTicketValidator } from '../validators/upload.validator.js'
import {
  createUploadTicket,
  getUploadConfig,
} from '../controllers/upload.controller.js'

const router = Router()

router.use(requireDatabase)
router.use(protect, authorize('admin'))

router.get('/overview', getOverview)

router.get('/uploads/config', getUploadConfig)
router.post(
  '/uploads/presign',
  createUploadTicketValidator,
  validate,
  createUploadTicket,
)

router.get('/categories', listAdminCategories)
router.post('/categories', createCategoryValidator, validate, createCategory)
router.patch('/categories/:id', updateCategoryValidator, validate, updateCategory)
router.delete('/categories/:id', categoryIdValidator, validate, deleteCategory)

router.get('/products', listAdminProducts)
router.get('/products/:id', productIdValidator, validate, getAdminProduct)
router.post('/products', createProductValidator, validate, createProduct)
router.patch('/products/:id', updateProductValidator, validate, updateProduct)
router.delete('/products/:id', productIdValidator, validate, deleteProduct)

router.get('/orders', listAdminOrders)
router.get('/orders/:id', orderIdValidator, validate, getAdminOrder)
router.patch(
  '/orders/:id/status',
  updateOrderStatusValidator,
  validate,
  updateAdminOrderStatus,
)

export default router
