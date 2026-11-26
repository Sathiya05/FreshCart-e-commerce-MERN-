import { Router } from 'express'
import {
  createCoupon,
  deleteCoupon,
  deleteReview,
  getOverview,
  getSalesReport,
  getSettings,
  listCoupons,
  listCustomers,
  listReviews,
  syncPayments,
  updateCoupon,
  updateCouponStatus,
  updateCustomerStatus,
  updateReviewStatus,
  updateSettings,
} from '../controllers/admin.controller.js'
import {
  createCategory,
  deleteCategory,
  listAdminCategories,
  updateCategory,
} from '../controllers/category.controller.js'
import {
  confirmCodPayment,
  getAdminOrder,
  listAdminOrders,
  updateAdminOrderStatus,
} from '../controllers/order.controller.js'
import { refundOrderPayment } from '../controllers/payment.controller.js'
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
  couponIdValidator,
  createCouponValidator,
  customerIdValidator,
  reviewIdValidator,
  setCouponStatusValidator,
  setCustomerStatusValidator,
  setReviewStatusValidator,
  updateCouponValidator,
  updateSettingsValidator,
} from '../validators/admin.validator.js'
import {
  listOrdersValidator,
  orderIdValidator,
  refundOrderValidator,
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
router.get('/reports', getSalesReport)
router.post('/payments/sync', syncPayments)

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

router.get('/orders', listOrdersValidator, validate, listAdminOrders)
router.get('/orders/:id', orderIdValidator, validate, getAdminOrder)
router.patch(
  '/orders/:id/status',
  updateOrderStatusValidator,
  validate,
  updateAdminOrderStatus,
)
router.patch(
  '/orders/:id/confirm-cod-payment',
  orderIdValidator,
  validate,
  confirmCodPayment,
)
router.post(
  '/orders/:id/refund',
  refundOrderValidator,
  validate,
  refundOrderPayment,
)

router.get('/customers', listCustomers)
router.patch(
  '/customers/:id/status',
  setCustomerStatusValidator,
  validate,
  updateCustomerStatus,
)

router.get('/coupons', listCoupons)
router.post('/coupons', createCouponValidator, validate, createCoupon)
router.patch(
  '/coupons/:id/status',
  setCouponStatusValidator,
  validate,
  updateCouponStatus,
)
router.patch('/coupons/:id', updateCouponValidator, validate, updateCoupon)
router.delete('/coupons/:id', couponIdValidator, validate, deleteCoupon)

router.get('/reviews', listReviews)
router.patch(
  '/reviews/:id/status',
  setReviewStatusValidator,
  validate,
  updateReviewStatus,
)
router.delete('/reviews/:id', reviewIdValidator, validate, deleteReview)

router.get('/settings', getSettings)
router.patch('/settings', updateSettingsValidator, validate, updateSettings)

export default router
