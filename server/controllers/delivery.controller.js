import { listDeliverySlots } from '../constants/delivery.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const getDeliverySlots = asyncHandler(async (_req, res) => {
  res.json({
    success: true,
    data: {
      slots: listDeliverySlots(),
    },
  })
})
