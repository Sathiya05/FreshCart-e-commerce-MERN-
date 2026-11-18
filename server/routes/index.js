import { Router } from 'express'
import adminRoutes from './admin.routes.js'
import authRoutes from './auth.routes.js'
import categoryRoutes from './category.routes.js'
import healthRoutes from './health.routes.js'
import productRoutes from './product.routes.js'

const router = Router()

router.use(healthRoutes)
router.use('/auth', authRoutes)
router.use('/categories', categoryRoutes)
router.use('/products', productRoutes)
router.use('/admin', adminRoutes)

export default router
