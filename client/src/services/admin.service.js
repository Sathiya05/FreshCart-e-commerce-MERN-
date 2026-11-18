import api from './api.js'
import { normalizeCategory, normalizeProduct } from './catalog.service.js'
import {
  DEMO_COUPONS,
  DEMO_CUSTOMERS,
  DEMO_ORDERS,
  DEMO_REVIEWS,
} from '../data/demoData.js'

/**
 * Protected admin catalog service backed by the Phase 3 REST API.
 *
 * Order, customer, coupon, review and sales endpoints belong to later phases.
 * Those exports keep explicit DEMO_ names so preview data cannot be mistaken
 * for live API results.
 */
const getData = (response) => response.data.data

export const getAdminOverview = () => api.get('/admin/overview').then(getData)

export const getAdminProducts = (params = {}) =>
  api
    .get('/admin/products', { params: { status: 'all', limit: 60, ...params } })
    .then((response) => ({
      ...getData(response),
      items: getData(response).items.map(normalizeProduct),
    }))

export const getAdminProduct = (id) =>
  api.get(`/admin/products/${encodeURIComponent(id)}`).then((response) => normalizeProduct(getData(response)))

export const createAdminProduct = (payload) =>
  api.post('/admin/products', payload).then((response) => normalizeProduct(getData(response)))

export const updateAdminProduct = (id, payload) =>
  api.patch(`/admin/products/${encodeURIComponent(id)}`, payload).then((response) => normalizeProduct(getData(response)))

export const deleteAdminProduct = (id) =>
  api.delete(`/admin/products/${encodeURIComponent(id)}`).then(getData)

export const getAdminCategories = () =>
  api.get('/admin/categories').then((response) => getData(response).map(normalizeCategory))

export const createAdminCategory = (payload) =>
  api.post('/admin/categories', payload).then((response) => normalizeCategory(getData(response)))

export const updateAdminCategory = (id, payload) =>
  api.patch(`/admin/categories/${encodeURIComponent(id)}`, payload).then((response) => normalizeCategory(getData(response)))

export const deleteAdminCategory = (id) =>
  api.delete(`/admin/categories/${encodeURIComponent(id)}`).then(getData)

export const getAdminInventory = async () => {
  const page = await getAdminProducts()
  return page.items.map((product) => ({
    id: product.id,
    name: product.name,
    sku: product.sku,
    category: product.categoryName,
    stock: product.stock,
    status: product.stock === 0
      ? 'Out of stock'
      : product.stock <= 20
        ? 'Low stock'
        : 'Healthy',
  }))
}

export const getDemoAdminOrders = async () => DEMO_ORDERS
export const getDemoAdminCustomers = async () => DEMO_CUSTOMERS
export const getDemoAdminCoupons = async () => DEMO_COUPONS
export const getDemoAdminReviews = async () => DEMO_REVIEWS
