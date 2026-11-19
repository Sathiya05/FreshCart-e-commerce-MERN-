import { Router } from 'express'
import accountRoutes from './account.routes.js'
import adminRoutes from './admin.routes.js'
import authRoutes from './auth.routes.js'
import cartRoutes from './cart.routes.js'
import categoryRoutes from './category.routes.js'
import healthRoutes from './health.routes.js'
import orderRoutes from './order.routes.js'
import paymentAliasRoutes from './payment-alias.routes.js'
import paymentRoutes from './payment.routes.js'
import productRoutes from './product.routes.js'

const router = Router()

router.use(healthRoutes)
router.use('/auth', authRoutes)
router.use('/account', accountRoutes)
router.use('/cart', cartRoutes)
router.use('/categories', categoryRoutes)
router.use('/orders', orderRoutes)
router.use(paymentAliasRoutes)
router.use('/payments', paymentRoutes)
router.use('/products', productRoutes)
router.use('/admin', adminRoutes)

export default router
