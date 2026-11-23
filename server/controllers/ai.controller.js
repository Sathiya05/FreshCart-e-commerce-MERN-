import { asyncHandler } from '../utils/asyncHandler.js'
import { getAiStatus, runAssistant } from '../services/ai.service.js'

export const getStatus = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: getAiStatus() })
})

export const chat = asyncHandler(async (req, res) => {
  const data = await runAssistant(req.body)
  res.json({ success: true, data })
})
