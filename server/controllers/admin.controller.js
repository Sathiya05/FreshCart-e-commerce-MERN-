import { asyncHandler } from '../utils/asyncHandler.js'
import { getAdminOverview } from '../services/catalog.service.js'

export const getOverview = asyncHandler(async (_req, res) => {
  const data = await getAdminOverview()
  res.json({ success: true, data })
})
