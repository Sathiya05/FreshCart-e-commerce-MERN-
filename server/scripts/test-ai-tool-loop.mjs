import assert from 'node:assert/strict'
import { AI_TOOL_NAMES } from '../constants/ai.js'
import { env } from '../config/env.js'
import {
  runAssistant,
  setGeminiClientForTesting,
} from '../services/ai.service.js'
import { executeAiTool } from '../services/aiTools.service.js'

const original = {
  aiConfigured: env.aiConfigured,
  aiProvider: env.aiProvider,
  aiModel: env.aiModel,
}
env.aiConfigured = true
env.aiProvider = 'gemini'
env.aiModel = 'test-gemini-model'

const calls = []
const fakeClient = {
  models: {
    generateContent: async ({ contents, config }) => {
      calls.push({ contents, config })
      if (calls.length === 1) {
        return {
          functionCalls: [
            {
              id: 'call-1',
              name: 'unsupported_test_tool',
              args: { probe: true },
            },
          ],
          candidates: [
            {
              content: {
                role: 'model',
                parts: [
                  {
                    functionCall: {
                      id: 'call-1',
                      name: 'unsupported_test_tool',
                      args: { probe: true },
                    },
                  },
                ],
              },
            },
          ],
        }
      }

      assert.equal(calls[1].contents.at(-1).role, 'user')
      assert.equal(calls[1].contents.at(-1).parts[0].functionResponse.id, 'call-1')
      assert.equal(
        calls[1].contents.at(-1).parts[0].functionResponse.name,
        'unsupported_test_tool',
      )
      return { candidates: [{ content: { parts: [{ text: 'Grounded answer.' }] } }] }
    },
  },
}

try {
  setGeminiClientForTesting(fakeClient)
  const result = await runAssistant({ message: 'test', history: [] })

  assert.equal(calls.length, 2)
  assert.equal(result.answer, 'Grounded answer.')
  assert.deepEqual(result.toolsUsed, ['unsupported_test_tool'])
  assert.equal(result.pendingConfirmation, null)
  assert.equal(result.cart, null)
  assert.ok(calls[0].config.tools[0].functionDeclarations.length >= 6)

  const blockedCommit = await executeAiTool(
    AI_TOOL_NAMES.ADD_TO_CART,
    { identifier: 'tomato', quantity: 1, confirmation_token: 'bogus' },
    {
      user: { id: 'test-user', role: 'customer' },
      confirmation: { token: 'bogus', confirmed: true },
    },
  )
  assert.equal(blockedCommit.error, 'Unsupported FreshCart tool.')

  console.log('Gemini tool-loop response handling checks passed.')
} finally {
  setGeminiClientForTesting(null)
  Object.assign(env, original)
}
