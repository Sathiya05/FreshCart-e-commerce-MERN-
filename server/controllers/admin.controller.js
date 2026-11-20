import { asyncHandler } from '../utils/asyncHandler.js'
import { getAdminOverview } from '../services/catalog.service.js'
import { getAdminSalesReport } from '../services/report.service.js'
import { syncPendingRazorpayPayments } from '../services/payment.service.js'
import * as adminManagement from '../services/adminManagement.service.js'

export const getOverview = asyncHandler(async (_req, res) => {
  const data = await getAdminOverview()
  res.json({ success: true, data })
})

export const getSalesReport = asyncHandler(async (_req, res) => {
  const data = await getAdminSalesReport()
  res.json({ success: true, data })
})

export const syncPayments = asyncHandler(async (_req, res) => {
  const data = await syncPendingRazorpayPayments()
  res.json({ success: true, data })
})

export const listCustomers = asyncHandler(async (_req, res) => {
  const data = await adminManagement.listAdminCustomers()
  res.json({ success: true, data })
})

export const updateCustomerStatus = asyncHandler(async (req, res) => {
  const data = await adminManagement.setCustomerActive(
    req.params.id,
    req.body.isActive,
  )
  res.json({ success: true, data })
})

export const listCoupons = asyncHandler(async (_req, res) => {
  const data = await adminManagement.listAdminCoupons()
  res.json({ success: true, data })
})

export const createCoupon = asyncHandler(async (req, res) => {
  const data = await adminManagement.createAdminCoupon(req.body)
  res.status(201).json({ success: true, data })
})

export const updateCoupon = asyncHandler(async (req, res) => {
  const data = await adminManagement.updateAdminCoupon(req.params.id, req.body)
  res.json({ success: true, data })
})

export const updateCouponStatus = asyncHandler(async (req, res) => {
  const data = await adminManagement.setCouponActive(
    req.params.id,
    req.body.isActive,
  )
  res.json({ success: true, data })
})

export const deleteCoupon = asyncHandler(async (req, res) => {
  const data = await adminManagement.deleteAdminCoupon(req.params.id)
  res.json({ success: true, data })
})

export const listReviews = asyncHandler(async (_req, res) => {
  const data = await adminManagement.listAdminReviews()
  res.json({ success: true, data })
})

export const updateReviewStatus = asyncHandler(async (req, res) => {
  const data = await adminManagement.setReviewStatus(
    req.params.id,
    req.body.status,
  )
  res.json({ success: true, data })
})

export const deleteReview = asyncHandler(async (req, res) => {
  const data = await adminManagement.deleteAdminReview(req.params.id)
  res.json({ success: true, data })
})

export const getSettings = asyncHandler(async (_req, res) => {
  const data = await adminManagement.getStoreSettings()
  res.json({ success: true, data })
})

export const updateSettings = asyncHandler(async (req, res) => {
  const data = await adminManagement.updateStoreSettings(req.body)
  res.json({ success: true, data })
})
