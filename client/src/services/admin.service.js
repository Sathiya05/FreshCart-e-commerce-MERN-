import api from './api.js'
import { normalizeCategory, normalizeProduct } from './catalog.service.js'

/**
 * Protected admin service backed by the FreshCart REST API. All list and
 * mutation functions here read/write the live database.
 */
const getData = (response) => response.data.data

export const getAdminOverview = () => api.get('/admin/overview').then(getData)

export const getUploadConfig = () =>
  api.get('/admin/uploads/config').then(getData)

const createUploadTicket = (file) =>
  api
    .post('/admin/uploads/presign', {
      fileName: file.name,
      contentType: file.type,
      size: file.size,
    })
    .then(getData)

/** Uploads straight to S3 with a short-lived presigned URL from the API. */
export const uploadProductImage = async (file) => {
  const ticket = await createUploadTicket(file)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)

  try {
    const response = await fetch(ticket.uploadUrl, {
      method: ticket.method || 'PUT',
      headers: { 'Content-Type': ticket.contentType },
      body: file,
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(
        `Upload failed (${response.status}). Check the S3 bucket CORS policy and IAM permissions.`,
      )
    }
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error('Upload timed out. Check your connection and S3 bucket CORS policy.')
    }
    // CORS/blocked requests surface as a TypeError with no useful message.
    if (error instanceof TypeError) {
      throw new Error('Could not reach S3. Check the bucket CORS policy and your connection.')
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }

  return ticket.publicUrl
}

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

export const getAdminReports = () => api.get('/admin/reports').then(getData)

export const syncAdminPayments = () =>
  api.post('/admin/payments/sync').then(getData)

export const getAdminCustomers = () =>
  api.get('/admin/customers').then(getData)

export const setAdminCustomerStatus = (id, isActive) =>
  api.patch(`/admin/customers/${encodeURIComponent(id)}/status`, { isActive }).then(getData)

export const getAdminCoupons = () => api.get('/admin/coupons').then(getData)

export const createAdminCoupon = (payload) =>
  api.post('/admin/coupons', payload).then(getData)

export const updateAdminCoupon = (id, payload) =>
  api.patch(`/admin/coupons/${encodeURIComponent(id)}`, payload).then(getData)

export const setAdminCouponStatus = (id, isActive) =>
  api.patch(`/admin/coupons/${encodeURIComponent(id)}/status`, { isActive }).then(getData)

export const deleteAdminCoupon = (id) =>
  api.delete(`/admin/coupons/${encodeURIComponent(id)}`).then(getData)

export const getAdminReviews = () => api.get('/admin/reviews').then(getData)

export const setAdminReviewStatus = (id, status) =>
  api.patch(`/admin/reviews/${encodeURIComponent(id)}/status`, { status }).then(getData)

export const deleteAdminReview = (id) =>
  api.delete(`/admin/reviews/${encodeURIComponent(id)}`).then(getData)

export const getAdminSettings = () => api.get('/admin/settings').then(getData)

export const updateAdminSettings = (payload) =>
  api.patch('/admin/settings', payload).then(getData)
