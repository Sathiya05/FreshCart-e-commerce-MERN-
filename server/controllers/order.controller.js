import * as orderService from '../services/order.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const adminActor = (req) => ({ adminId: req.user?.id, note: req.body?.note })

export const createOrder = asyncHandler(async (req, res) => {
  const data = await orderService.createOrderFromCart(req.user.id, req.body)
  res.status(201).json({ success: true, data })
})

export const listMyOrders = asyncHandler(async (req, res) => {
  const data = await orderService.listUserOrders(req.user.id, req.query)
  res.json({ success: true, data })
})

export const getMyOrder = asyncHandler(async (req, res) => {
  const data = await orderService.getUserOrder(req.user.id, req.params.id)
  res.json({ success: true, data })
})

export const trackMyOrder = asyncHandler(async (req, res) => {
  const data = await orderService.getOrderTracking(req.user.id, req.params.id)
  res.json({ success: true, data })
})

export const listAdminOrders = asyncHandler(async (req, res) => {
  const data = await orderService.listAdminOrders(req.query)
  res.json({ success: true, data })
})

export const getAdminOrder = asyncHandler(async (req, res) => {
  const data = await orderService.getAdminOrder(req.params.id)
  res.json({ success: true, data })
})

export const updateAdminOrderStatus = asyncHandler(async (req, res) => {
  const data = await orderService.updateAdminOrderStatus(
    req.params.id,
    req.body.status,
    adminActor(req),
  )
  res.json({ success: true, data })
})

export const confirmCodPayment = asyncHandler(async (req, res) => {
  const data = await orderService.confirmCodPayment(req.params.id, req.user.id)
  res.json({ success: true, data })
})
