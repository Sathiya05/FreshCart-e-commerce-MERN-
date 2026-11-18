import {
  DEMO_ADMIN_METRICS,
  DEMO_CATEGORIES,
  DEMO_COUPONS,
  DEMO_CUSTOMERS,
  DEMO_ORDERS,
  DEMO_PRODUCTS,
  DEMO_REVIEWS,
} from '../data/demoData.js'

/** PHASE 2 DEMO SERVICE. Replace with protected admin APIs in Phase 3. */
const wait = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms))

export const getAdminDashboard = async () => {
  await wait(240)
  return DEMO_ADMIN_METRICS
}

export const getAdminProducts = async () => {
  await wait()
  return DEMO_PRODUCTS
}

export const getAdminCategories = async () => {
  await wait()
  return DEMO_CATEGORIES
}

export const getAdminInventory = async () => {
  await wait()
  return DEMO_PRODUCTS.map((product) => ({
    id: product.id,
    name: product.name,
    sku: product.sku,
    category: product.categoryName,
    stock: product.stock,
    status: product.stock <= 15 ? 'Low stock' : product.stock <= 30 ? 'Moderate' : 'Healthy',
  }))
}

export const getAdminOrders = async () => {
  await wait()
  return DEMO_ORDERS
}

export const getAdminCustomers = async () => {
  await wait()
  return DEMO_CUSTOMERS
}

export const getAdminCoupons = async () => {
  await wait()
  return DEMO_COUPONS
}

export const getAdminReviews = async () => {
  await wait()
  return DEMO_REVIEWS
}

export const getSalesReport = async () => {
  await wait(220)
  return {
    series: DEMO_ADMIN_METRICS.revenueSeries,
    categories: DEMO_ADMIN_METRICS.categorySales,
    bestSellers: DEMO_ADMIN_METRICS.bestSellers,
  }
}
