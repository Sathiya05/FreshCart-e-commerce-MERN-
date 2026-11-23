import { asyncHandler } from '../utils/asyncHandler.js'
import { getAiStatus, runAssistant } from '../services/ai.service.js'

export const getStatus = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: getAiStatus() })
})

export const chat = asyncHandler(async (req, res) => {
  const user = req.user
    ? { id: req.user._id, role: req.user.role }
    : undefined

  const data = await runAssistant({
    ...req.body,
    user,
    confirmation: req.body.confirmation,
  })
  res.json({ success: true, data })
})
