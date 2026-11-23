import { env } from '../config/env.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import {
  getWhatsAppStatus,
  processWhatsAppWebhook,
} from '../services/whatsapp.service.js'

export const getStatus = asyncHandler(async (_req, res) => {
  res.json({ success: true, data: getWhatsAppStatus() })
})

/** Meta verifies a webhook with a GET challenge when the callback is saved. */
export const verifyWebhook = (req, res) => {
  const mode = req.query?.['hub.mode']
  const token = req.query?.['hub.verify_token']
  const challenge = req.query?.['hub.challenge']

  if (
    mode === 'subscribe' &&
    env.whatsappVerifyToken &&
    token === env.whatsappVerifyToken &&
    challenge
  ) {
    return res.status(200).type('text/plain').send(String(challenge))
  }

  return res.status(403).json({
    success: false,
    error: {
      code: 'WEBHOOK_VERIFICATION_FAILED',
      message: 'WhatsApp webhook verification failed.',
    },
  })
}

export const receiveWebhook = asyncHandler(async (req, res) => {
  const result = await processWhatsAppWebhook(
    req.rawBody,
    req.get('x-hub-signature-256'),
  )

  res.status(200).json({ success: true, data: result })
})
