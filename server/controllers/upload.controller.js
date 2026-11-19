import * as uploadService from '../services/upload.service.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const getUploadConfig = (_req, res) => {
  res.json({ success: true, data: uploadService.getUploadConfig() })
}

export const createUploadTicket = asyncHandler(async (req, res) => {
  const data = await uploadService.createImageUploadTicket(req.body)
  res.status(201).json({ success: true, data })
})
