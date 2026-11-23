import { env } from '../config/env.js'
import { AI_LIMITS, AI_SYSTEM_INSTRUCTIONS } from '../constants/ai.js'
import { ApiError } from '../utils/apiError.js'
import { AI_TOOLS, executeAiTool } from './aiTools.service.js'

export const getAiStatus = () => ({
  configured: env.aiConfigured,
  provider: env.aiConfigured ? env.aiProvider : 'none',
  model: env.aiConfigured ? env.aiModel : '',
})

const sanitizeHistory = (history) =>
  (Array.isArray(history) ? history : [])
    .slice(-AI_LIMITS.HISTORY_MAX)
    .filter(
      (item) =>
        item &&
        (item.role === 'user' || item.role === 'assistant') &&
        typeof item.content === 'string' &&
        item.content.trim(),
    )
    .map((item) => ({
      role: item.role,
      content: item.content.trim().slice(0, AI_LIMITS.HISTORY_CONTENT_MAX),
    }))

const buildInput = (message, history) => [
  ...sanitizeHistory(history),
  { role: 'user', content: message },
]

const responseTools = AI_TOOLS.map((tool) => ({
  type: 'function',
  name: tool.name,
  description: tool.description,
  parameters: tool.parameters,
  strict: true,
}))

const parseProviderResponse = (payload) => {
  const output = Array.isArray(payload?.output) ? payload.output : []
  const calls = output.filter(
    (item) => item?.type === 'function_call' && item.call_id && item.name,
  )
  const texts = []

  for (const item of output) {
    if (item?.type !== 'message' || !Array.isArray(item.content)) continue

    for (const content of item.content) {
      if (content?.type === 'output_text' && content.text) texts.push(content.text)
      if (content?.type === 'refusal' && content.refusal) texts.push(content.refusal)
    }
  }

  return { output, calls, text: texts.join('\n').trim() }
}

const collectProducts = (result) => {
  const products = []

  if (Array.isArray(result?.products)) products.push(...result.products)
  if (result?.found && result?.product) products.push(result.product)

  return products.filter((product) => product?.id)
}

const callProvider = async (input) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), env.aiTimeoutMs)

  const body = {
    model: env.aiModel,
    instructions: AI_SYSTEM_INSTRUCTIONS,
    input,
    tools: responseTools,
    tool_choice: 'auto',
    store: false,
    include: ['reasoning.encrypted_content'],
  }

  if (env.aiReasoningEffort) {
    body.reasoning = { effort: env.aiReasoningEffort }
  }

  try {
    const response = await fetch(`${env.aiApiBaseUrl}/responses`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.aiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (!response.ok) {
      let providerCode = ''
      try {
        const payload = await response.json()
        providerCode = payload?.error?.code || payload?.error?.type || ''
      } catch {
        // Keep the client message generic even when the provider body is not JSON.
      }
      console.error('[ai] Provider rejected request:', response.status, providerCode)
      throw new ApiError(
        502,
        'The AI provider could not answer right now. Please try again shortly.',
        'AI_PROVIDER_ERROR',
      )
    }

    return await response.json()
  } catch (error) {
    if (error instanceof ApiError) throw error

    if (error?.name === 'AbortError') {
      throw new ApiError(
        504,
        'The AI assistant took too long to respond. Please try again.',
        'AI_TIMEOUT',
      )
    }

    console.error('[ai] Provider request failed:', error?.message || error)
    throw new ApiError(
      502,
      'The AI provider is unavailable right now. Please try again shortly.',
      'AI_PROVIDER_ERROR',
    )
  } finally {
    clearTimeout(timeout)
  }
}

export const runAssistant = async ({ message, history = [] }) => {
  if (!env.aiConfigured) {
    throw new ApiError(
      503,
      'AI assistant is not configured yet. Add AI_API_KEY to the server environment to enable it.',
      'AI_NOT_CONFIGURED',
    )
  }

  let input = buildInput(message, history)
  const productsById = new Map()
  const toolsUsed = []

  for (let round = 0; round < env.aiMaxToolRounds; round += 1) {
    const payload = await callProvider(input)
    const { output, calls, text } = parseProviderResponse(payload)

    if (!calls.length) {
      return {
        answer:
          text ||
          'I could not produce an answer from the catalog results. Please try rephrasing your question.',
        products: [...productsById.values()].slice(0, AI_LIMITS.ANSWER_PRODUCTS_MAX),
        toolsUsed,
      }
    }

    // Preserve model output (including reasoning items) before adding tool results.
    input = [...input, ...output]

    const toolOutputs = await Promise.all(
      calls.map(async (call) => {
        let args = {}
        try {
          args = JSON.parse(call.arguments || '{}')
        } catch {
          args = {}
        }

        toolsUsed.push(call.name)
        const result = await executeAiTool(call.name, args)

        for (const product of collectProducts(result)) {
          productsById.set(product.id, product)
        }

        return {
          type: 'function_call_output',
          call_id: call.call_id,
          output: JSON.stringify(result),
        }
      }),
    )

    input = [...input, ...toolOutputs]
  }

  throw new ApiError(
    504,
    'The assistant needed too many catalog lookups for that question. Please narrow your search.',
    'AI_TOOL_LIMIT',
  )
}
