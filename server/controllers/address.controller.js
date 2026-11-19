import * as addressService from '../services/address.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const listAddresses = asyncHandler(async (req, res) => {
  const data = await addressService.listAddresses(req.user.id)
  res.json({ success: true, data })
})

export const createAddress = asyncHandler(async (req, res) => {
  const data = await addressService.createAddress(req.user.id, req.body)
  res.status(201).json({ success: true, data })
})

export const updateAddress = asyncHandler(async (req, res) => {
  const data = await addressService.updateAddress(
    req.user.id,
    req.params.id,
    req.body,
  )
  res.json({ success: true, data })
})

export const deleteAddress = asyncHandler(async (req, res) => {
  const data = await addressService.deleteAddress(req.user.id, req.params.id)
  res.json({ success: true, data })
})

export const setDefaultAddress = asyncHandler(async (req, res) => {
  const data = await addressService.setDefaultAddress(req.user.id, req.params.id)
  res.json({ success: true, data })
})
