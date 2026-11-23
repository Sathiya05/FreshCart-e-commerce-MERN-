import { createHmac, timingSafeEqual } from 'node:crypto'
import { env } from '../config/env.js'
import {
  WHATSAPP_HELP,
  WHATSAPP_TEXT_MAX,
  WHATSAPP_WELCOME,
} from '../constants/whatsapp.js'
import { WhatsAppMessage } from '../models/WhatsAppMessage.js'
import { runAssistant } from './ai.service.js'
import { ApiError } from '../utils/apiError.js'

export const getWhatsAppStatus = () => ({
  configured: env.whatsappConfigured,
  webhookConfigured: env.whatsappWebhookConfigured,
  sendConfigured: env.whatsappSendConfigured,
  apiVersion: env.whatsappApiVersion,
})

/** Meta sends `sha256=<hex>` in X-Hub-Signature-256 over the exact raw body. */
export const verifyWebhookSignature = (rawBody, signature) => {
  if (!rawBody || !signature || !env.whatsappAppSecret) return false

  const expected = createHmac('sha256', env.whatsappAppSecret)
    .update(rawBody)
    .digest('hex')
  const received = String(signature).replace(/^sha256=/i, '').trim()

  const expectedBuffer = Buffer.from(expected, 'hex')
  const receivedBuffer = Buffer.from(received, 'hex')

  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  )
}

export const extractWhatsAppMessages = (payload) => {
  const messages = []

  for (const entry of Array.isArray(payload?.entry) ? payload.entry : []) {
    for (const change of Array.isArray(entry?.changes) ? entry.changes : []) {
      if (change?.field !== 'messages') continue

      for (const message of Array.isArray(change?.value?.messages) ? change.value.messages : []) {
        if (message?.type !== 'text' || !message?.text?.body) continue
        if (!message?.id || !message?.from) continue

        messages.push({
          id: String(message.id),
          from: String(message.from),
          text: String(message.text.body),
        })
      }
    }
  }

  return messages
}

/** WhatsApp does not render Markdown, so convert the assistant's light formatting. */
const formatForWhatsApp = (text) =>
  String(text || '')
    .replace(/\*\*/g, '')
    .replace(/^[-*]\s+/gm, '• ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

export const splitWhatsAppText = (text, maxLength = WHATSAPP_TEXT_MAX) => {
  const clean = formatForWhatsApp(text)
  if (!clean) return []
  if (clean.length <= maxLength) return [clean]

  const chunks = []
  let current = ''

  const pushCurrent = () => {
    if (current.trim()) chunks.push(current.trim())
    current = ''
  }

  for (const paragraph of clean.split(/\n{2,}/)) {
    for (const line of paragraph.split('\n')) {
      let wordLine = ''

      for (const word of line.split(/\s+/).filter(Boolean)) {
        if (word.length > maxLength) {
          if (wordLine) {
            const candidate = current ? `${current}\n${wordLine}` : wordLine
            if (candidate.length > maxLength) {
              pushCurrent()
              current = wordLine
            } else {
              current = candidate
            }
            wordLine = ''
          }

          pushCurrent()
          for (let index = 0; index < word.length; index += maxLength) {
            chunks.push(word.slice(index, index + maxLength))
          }
          continue
        }

        const candidate = wordLine ? `${wordLine} ${word}` : word
        if (candidate.length > maxLength) {
          if (wordLine) {
            const withCurrent = current ? `${current}\n${wordLine}` : wordLine
            if (withCurrent.length > maxLength) {
              pushCurrent()
              current = wordLine
            } else {
              current = withCurrent
            }
          }
          wordLine = word
        } else {
          wordLine = candidate
        }
      }

      if (wordLine) {
        const candidate = current ? `${current}\n${wordLine}` : wordLine
        if (candidate.length > maxLength) {
          pushCurrent()
          current = wordLine
        } else {
          current = candidate
        }
      }
    }

    pushCurrent()
  }

  return chunks
}

export const sendWhatsAppText = async (to, text) => {
  if (!env.whatsappSendConfigured) {
    throw new ApiError(503, 'WhatsApp assistant is not configured.', 'WHATSAPP_NOT_CONFIGURED')
  }

  const url = `https://graph.facebook.com/${env.whatsappApiVersion}/${env.whatsappPhoneNumberId}/messages`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.whatsappAccessToken}`,
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { preview_url: false, body: text },
    }),
    signal: AbortSignal.timeout(15000),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload?.error?.message || `WhatsApp API returned ${response.status}`)
  }

  return payload?.messages?.[0]?.id || ''
}

const buildReply = async (text) => {
  const normalized = text.trim().toLowerCase()

  if (['help', 'menu', 'commands'].includes(normalized)) {
    return WHATSAPP_HELP
  }

  if (['hi', 'hello', 'hey', 'start'].includes(normalized)) {
    return `${WHATSAPP_WELCOME}\n\nType help to see example questions.`
  }

  // No user is passed: WhatsApp is catalog/FAQ-only and cannot access carts.
  const result = await runAssistant({ message: text.slice(0, 500), history: [] })
  return result.answer
}

const replyToMessage = async (messageId, from, text) => {
  try {
    const answer = await buildReply(text)
    const chunks = splitWhatsAppText(answer)
    const sentIds = []

    for (const chunk of chunks) {
      sentIds.push(await sendWhatsAppText(from, chunk))
    }

    await WhatsAppMessage.updateOne(
      { messageId },
      {
        $set: {
          status: 'replied',
          replyMessageId: sentIds.filter(Boolean).join(','),
          error: '',
        },
      },
    )
  } catch (error) {
    console.error('[whatsapp] Failed to answer message:', error?.message || error)
    await WhatsAppMessage.updateOne(
      { messageId },
      { $set: { status: 'failed', error: String(error?.message || error).slice(0, 500) } },
    )
  }
}

/**
 * Verify, deduplicate and queue inbound messages. Meta only needs a fast 200;
 * Gemini and the Cloud API call happen after the response is sent.
 */
export const processWhatsAppWebhook = async (rawBody, signature) => {
  if (!env.whatsappWebhookConfigured) {
    throw new ApiError(
      503,
      'WhatsApp webhook is not configured.',
      'WHATSAPP_NOT_CONFIGURED',
    )
  }

  if (!verifyWebhookSignature(rawBody, signature)) {
    throw new ApiError(
      400,
      'The WhatsApp webhook signature could not be verified.',
      'INVALID_WEBHOOK_SIGNATURE',
    )
  }

  let payload
  try {
    payload = JSON.parse(rawBody?.toString?.('utf8') || '')
  } catch {
    throw new ApiError(400, 'Invalid WhatsApp webhook payload.', 'INVALID_WEBHOOK_PAYLOAD')
  }

  const messages = extractWhatsAppMessages(payload)
  let queued = 0
  let ignored = 0

  for (const message of messages) {
    if (!message.text.trim()) {
      ignored += 1
      continue
    }

    try {
      await WhatsAppMessage.create({
        messageId: message.id,
        from: message.from,
        text: message.text.trim().slice(0, 2000),
        status: 'processing',
      })
    } catch (error) {
      if (error?.code === 11000) {
        ignored += 1
        continue
      }
      throw error
    }

    queued += 1
    setImmediate(() => {
      void replyToMessage(message.id, message.from, message.text.trim())
    })
  }

  return { queued, ignored }
}
