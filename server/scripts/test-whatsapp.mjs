import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'

process.env.WHATSAPP_ACCESS_TOKEN = 'mock-token'
process.env.WHATSAPP_PHONE_NUMBER_ID = '123456789'
process.env.WHATSAPP_VERIFY_TOKEN = 'mock-verify-token'
process.env.WHATSAPP_APP_SECRET = 'mock-app-secret'
process.env.WHATSAPP_API_VERSION = 'v27.0'

const whatsapp = await import(new URL('../services/whatsapp.service.js', import.meta.url))

const rawBody = JSON.stringify({
  entry: [
    {
      changes: [
        {
          field: 'messages',
          value: {
            messages: [
              {
                id: 'wamid.1',
                from: '919876543210',
                type: 'text',
                text: { body: 'What vegetables are available?' },
              },
            ],
          },
        },
      ],
    },
  ],
})

const digest = createHmac('sha256', 'mock-app-secret').update(rawBody).digest('hex')

assert.equal(whatsapp.verifyWebhookSignature(rawBody, `sha256=${digest}`), true)
assert.equal(whatsapp.verifyWebhookSignature(rawBody, 'sha256=deadbeef'), false)
assert.equal(whatsapp.verifyWebhookSignature(rawBody, ''), false)

const messages = whatsapp.extractWhatsAppMessages(JSON.parse(rawBody))
assert.equal(messages.length, 1)
assert.equal(messages[0].id, 'wamid.1')
assert.equal(messages[0].text, 'What vegetables are available?')

const chunks = whatsapp.splitWhatsAppText('one two three four five six seven eight', 12)
assert(chunks.every((chunk) => chunk.length <= 12))
assert.equal(
  chunks.join(' ').replace(/\s+/g, ' ').trim(),
  'one two three four five six seven eight',
)

assert.deepEqual(whatsapp.getWhatsAppStatus(), {
  configured: true,
  webhookConfigured: true,
  sendConfigured: true,
  apiVersion: 'v27.0',
})

console.log('WhatsApp service tests passed')
