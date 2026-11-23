import assert from 'node:assert/strict'
import mongoose from 'mongoose'
import { connectDatabase } from '../config/database.js'
import { env } from '../config/env.js'
import { Cart } from '../models/Cart.js'
import { UsedConfirmationToken } from '../models/UsedConfirmationToken.js'
import {
  runAssistant,
  setGeminiClientForTesting,
} from '../services/ai.service.js'
import { getCart } from '../services/cart.service.js'

const original = {
  aiConfigured: env.aiConfigured,
  aiProvider: env.aiProvider,
  aiModel: env.aiModel,
}
env.aiConfigured = true
env.aiProvider = 'gemini'
env.aiModel = 'test-gemini-model'

const userId = new mongoose.Types.ObjectId()
const user = { id: String(userId), role: 'customer' }
let calls = 0
let jti = ''

const fakeClient = {
  models: {
    generateContent: async () => {
      calls += 1
      if (calls === 1) {
        const functionCall = {
          id: 'call-prepare',
          name: 'prepare_cart_change',
          args: { action: 'add', identifier: 'Farm Fresh Tomatoes', quantity: 1 },
        }
        return {
          functionCalls: [functionCall],
          candidates: [{ content: { role: 'model', parts: [{ functionCall }] } }],
        }
      }
      return { candidates: [{ content: { parts: [{ text: 'Okay.' }] } }] }
    },
  },
}

try {
  await connectDatabase()
  setGeminiClientForTesting(fakeClient)

  const prepared = await runAssistant({ message: 'Add 1 tomato', user })
  const pending = prepared.pendingConfirmation
  assert.ok(pending?.token, 'Expected a pending cart confirmation')
  assert.equal(pending.action, 'add')
  assert.equal(pending.quantity, 1)
  jti = JSON.parse(Buffer.from(pending.token.split('.')[0], 'base64url').toString('utf8')).i

  const disapproved = await runAssistant({
    message: 'What is in my cart?',
    user,
    confirmation: { ...pending, confirmed: false },
  })
  assert.equal(disapproved.answer, 'Okay.')
  assert.equal((await getCart(String(userId))).itemCount, 0)

  const committed = await runAssistant({
    message: 'Yes, confirm.',
    user,
    confirmation: { ...pending, confirmed: true },
  })
  assert.ok(committed.toolsUsed.includes('add_to_cart'))
  assert.equal(committed.cart.itemCount, 1)
  assert.equal((await getCart(String(userId))).itemCount, 1)

  const replayed = await runAssistant({
    message: 'Yes, confirm.',
    user,
    confirmation: { ...pending, confirmed: true },
  })
  assert.match(replayed.answer, /already used|missing or has expired/i)
  assert.equal((await getCart(String(userId))).itemCount, 1)

  console.log('AI cart confirmation flow checks passed.')
} finally {
  setGeminiClientForTesting(null)
  if (jti) await UsedConfirmationToken.deleteMany({ jti })
  await Cart.deleteMany({ user: userId })
  await mongoose.disconnect()
  Object.assign(env, original)
}
