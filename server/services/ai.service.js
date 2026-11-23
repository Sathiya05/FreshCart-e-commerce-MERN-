import { GoogleGenAI, Type } from '@google/genai'
import { env } from '../config/env.js'
import { AI_LIMITS, AI_SYSTEM_INSTRUCTIONS, AI_TOOL_NAMES } from '../constants/ai.js'
import { ApiError } from '../utils/apiError.js'
import { executeAiTool, getAiTools } from './aiTools.service.js'

export const getAiStatus = () => ({
  configured: env.aiConfigured,
  provider: env.aiConfigured ? env.aiProvider : 'none',
  model: env.aiConfigured ? env.aiModel : '',
  // Non-secret diagnostics for deployment troubleshooting.
  providerValid: env.aiProviderValid,
  keyPresent: env.aiKeyPresent,
})

const GEMINI_TYPES = {
  object: Type.OBJECT,
  string: Type.STRING,
  integer: Type.INTEGER,
  number: Type.NUMBER,
  boolean: Type.BOOLEAN,
  array: Type.ARRAY,
}

/** Convert the local JSON-schema-like tool definitions to Gemini's Schema type. */
const toGeminiSchema = (schema = {}) => {
  const result = {}
  const rawType = schema.type

  if (Array.isArray(rawType)) {
    const concreteType = rawType.find((value) => value !== 'null')
    if (GEMINI_TYPES[concreteType]) result.type = GEMINI_TYPES[concreteType]
    if (rawType.includes('null')) result.nullable = true
  } else if (GEMINI_TYPES[rawType]) {
    result.type = GEMINI_TYPES[rawType]
  }

  for (const key of [
    'description',
    'format',
    'enum',
    'required',
    'minimum',
    'maximum',
    'minLength',
    'maxLength',
  ]) {
    if (schema[key] !== undefined) result[key] = schema[key]
  }

  if (schema.properties) {
    result.properties = Object.fromEntries(
      Object.entries(schema.properties).map(([name, property]) => [
        name,
        toGeminiSchema(property),
      ]),
    )
  }

  if (schema.items) result.items = toGeminiSchema(schema.items)

  return result
}

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
      role: item.role === 'assistant' ? 'model' : 'user',
      parts: [
        {
          text: item.content.trim().slice(0, AI_LIMITS.HISTORY_CONTENT_MAX),
        },
      ],
    }))

const buildContents = (message, history) => [
  ...sanitizeHistory(history),
  {
    role: 'user',
    parts: [
      {
        text: String(message || '')
          .trim()
          .slice(0, AI_LIMITS.MESSAGE_MAX),
      },
    ],
  },
]

const buildGeminiTools = (toolContext) => [
  {
    functionDeclarations: getAiTools(toolContext).map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: toGeminiSchema(tool.parameters),
    })),
  },
]

let geminiClient = null

/** Allows deterministic tests to inject a fake SDK client. Not exposed over HTTP. */
export const setGeminiClientForTesting = (client) => {
  geminiClient = client
}

const getGeminiClient = () => {
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey: env.geminiApiKey })
  }
  return geminiClient
}

const extractText = (response) => {
  const parts = response?.candidates?.[0]?.content?.parts
  if (Array.isArray(parts)) {
    return parts
      .map((part) => (typeof part?.text === 'string' ? part.text : ''))
      .join('\n')
      .trim()
  }

  try {
    return typeof response?.text === 'string' ? response.text.trim() : ''
  } catch {
    return ''
  }
}

const parseCallArguments = (value) => {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value
  if (typeof value !== 'string') return {}

  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

const canonicalCallKey = (name, args) => {
  if (name === 'search_products' || name === 'recommend_products') {
    return [
      name,
      String(args.query || '').trim().toLowerCase(),
      String(args.category || '').trim().toLowerCase(),
      String(args.min_price ?? ''),
      String(args.max_price ?? ''),
      String(args.in_stock_only ?? args.only_in_stock ?? ''),
    ].join(':')
  }
  return `${name}:${JSON.stringify(args)}`
}

const buildGroundedFallbackAnswer = (products) => {
  const lines = products.slice(0, AI_LIMITS.ANSWER_PRODUCTS_MAX).map((product) => {
    const price = Number(product.effectivePrice ?? product.discountPrice ?? product.price) || 0
    const stock = Number(product.stock) || 0
    const availability = stock > 0 ? 'In stock' : 'Out of stock'
    return `- ${product.name || 'Product'} — ₹${price.toFixed(2)}${product.unit ? ` / ${product.unit}` : ''} (${availability})`
  })

  return [
    'Here are the matching products from the live FreshCart catalog:',
    ...lines,
    'Ask about any item for more details.',
  ].join('\n')
}

const collectProducts = (result, productsById) => {
  const candidates = [
    ...(Array.isArray(result?.products) ? result.products : []),
    result?.product,
    result?.addedProduct,
  ]

  for (const product of candidates) {
    if (product?.id) productsById.set(product.id, product)
  }
}

const callProvider = async ({ contents, tools, signal }) => {
  try {
    return await getGeminiClient().models.generateContent({
      model: env.aiModel,
      contents,
      config: {
        systemInstruction: AI_SYSTEM_INSTRUCTIONS,
        tools,
        temperature: 0.2,
        abortSignal: signal,
      },
    })
  } catch (error) {
    if (error instanceof ApiError) throw error

    if (
      error?.name === 'AbortError' ||
      error?.name === 'TimeoutError' ||
      /aborted/i.test(error?.message || '')
    ) {
      throw new ApiError(
        504,
        'The AI assistant took too long to respond. Please try again.',
        'AI_TIMEOUT',
      )
    }

    const status = error?.status || error?.statusCode || error?.response?.status
    const providerMessage = String(error?.message || '')
    const isRateLimited =
      status === 429 ||
      /quota|rate limit|resource_exhausted|too many requests/i.test(providerMessage)

    if (isRateLimited) {
      console.warn('[ai] Gemini rate limited:', status || '')
      throw new ApiError(
        429,
        'The assistant is busy right now. Please try again shortly.',
        'AI_RATE_LIMITED',
      )
    }

    console.error('[ai] Gemini request failed:', status || '', providerMessage)
    throw new ApiError(
      502,
      'The AI provider could not answer right now. Please try again shortly.',
      'AI_PROVIDER_ERROR',
    )
  }
}

const COMMIT_TOOLS_BY_ACTION = {
  add: AI_TOOL_NAMES.ADD_TO_CART,
  update: AI_TOOL_NAMES.UPDATE_CART_ITEM,
  remove: AI_TOOL_NAMES.REMOVE_CART_ITEM,
  clear: AI_TOOL_NAMES.CLEAR_CART,
}

const applyConfirmedCartChange = async ({ confirmation, toolContext }) => {
  const action = String(confirmation?.action || '')
  const tool = COMMIT_TOOLS_BY_ACTION[action]
  if (!tool || !confirmation?.token || confirmation?.confirmed !== true) return null

  const args = {
    identifier: confirmation.productId || '',
    quantity: Number(confirmation.quantity) || 0,
    confirmation_token: confirmation.token,
  }

  const result = await executeAiTool(tool, args, toolContext, { allowInternal: true })
  const productsById = new Map()
  collectProducts(result, productsById)
  const products = [...productsById.values()]

  if (!result?.confirmed) {
    return {
      answer:
        result?.error ||
        'That confirmation is no longer valid. Please ask for the change again.',
      products,
      toolsUsed: [tool],
      pendingConfirmation: null,
      cart: null,
    }
  }

  return {
    answer: `${result.message || 'Your cart has been updated.'} Your cart total is now ₹${Number(result.totalAmount || 0).toFixed(2)}.`,
    products,
    toolsUsed: [tool],
    pendingConfirmation: null,
    cart: {
      items: result.items || [],
      itemCount: result.itemCount,
      subtotal: result.subtotal,
      deliveryFee: result.deliveryFee,
      totalAmount: result.totalAmount,
    },
  }
}

export const runAssistant = async ({ message, history = [], user, confirmation } = {}) => {
  if (!env.aiConfigured) {
    throw new ApiError(
      503,
      'AI assistant is unavailable right now. Shopping and checkout still work normally.',
      'AI_NOT_CONFIGURED',
    )
  }

  const toolContext = user
    ? { user: { id: user.id || user._id, role: user.role }, confirmation }
    : {}

  const isCustomer = user && (!user.role || user.role === 'customer')
  if (
    isCustomer &&
    confirmation?.confirmed === true &&
    confirmation?.token
  ) {
    const confirmed = await applyConfirmedCartChange({ confirmation, toolContext })
    if (confirmed) return confirmed
  }

  const tools = buildGeminiTools(toolContext)
  const productsById = new Map()
  const toolsUsed = []
  let pendingConfirmation = null
  let cartSnapshot = null
  const seenCallKeys = new Set()
  const toolCallCounts = new Map()
  let contents = buildContents(message, history)

  for (let round = 0; round < env.aiMaxToolRounds; round += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), env.aiTimeoutMs)

    let response
    try {
      response = await callProvider({ contents, tools, signal: controller.signal })
    } finally {
      clearTimeout(timeout)
    }

    const calls = Array.isArray(response?.functionCalls) ? response.functionCalls : []
    const text = extractText(response)

    if (!calls.length) {
      return {
        answer:
          text ||
          'I could not produce an answer from the FreshCart results. Please try rephrasing your question.',
        products: [...productsById.values()].slice(0, AI_LIMITS.ANSWER_PRODUCTS_MAX),
        toolsUsed,
        pendingConfirmation,
        cart: cartSnapshot,
      }
    }

    // Gemini 3 function calls carry IDs and, for thinking models, signatures.
    // Passing the model content back unchanged is required for the next turn.
    const modelContent =
      response?.candidates?.[0]?.content ||
      {
        role: 'model',
        parts: calls.map((call) => ({
          functionCall: {
            id: call.id,
            name: call.name,
            args: call.args || {},
          },
        })),
      }

    contents = [...contents, modelContent]

    const functionResponseParts = []

    for (const call of calls) {
      if (!call?.name) continue

      const args = parseCallArguments(call.args)
      const callKey = canonicalCallKey(call.name, args)
      const callCount = (toolCallCounts.get(call.name) || 0) + 1
      toolCallCounts.set(call.name, callCount)

      // Gemini sometimes retries a lookup with slightly different arguments.
      // Return the earlier answer instead of repeating database work.
      if (seenCallKeys.has(callKey) || callCount > 2) {
        toolsUsed.push(call.name)
        functionResponseParts.push({
          functionResponse: {
            id: call.id,
            name: call.name,
            response: {
              ok: false,
              error: 'This FreshCart lookup was already completed. Use the earlier result and answer now; do not call this tool again.',
            },
          },
        })
        continue
      }

      seenCallKeys.add(callKey)
      toolsUsed.push(call.name)

      const result = await executeAiTool(call.name, args, toolContext)
      collectProducts(result, productsById)

      if (
        Array.isArray(result?.items) &&
        result.subtotal !== undefined &&
        result.totalAmount !== undefined
      ) {
        cartSnapshot = {
          items: result.items,
          itemCount: result.itemCount,
          subtotal: result.subtotal,
          deliveryFee: result.deliveryFee,
          totalAmount: result.totalAmount,
        }
      }

      if (result?.needsConfirmation && result.confirmationToken) {
        pendingConfirmation = {
          token: result.confirmationToken,
          action: result.action || '',
          productId: result.productId || '',
          quantity: Number(result.quantity) || 0,
          summary: result.summary || '',
        }
      } else if (result?.confirmed) {
        pendingConfirmation = null
      }

      let resultPayload = result
      try {
        resultPayload = JSON.parse(JSON.stringify(result ?? { ok: false }))
        // Confirmation tokens are capabilities for the client, not text for the
        // model to repeat. The client supplies them back out of band.
        delete resultPayload.confirmationToken
      } catch {
        resultPayload = {
          ok: false,
          error: 'FreshCart information is temporarily unavailable. Tell the customer to try again; do not guess.',
        }
      }

      functionResponseParts.push({
        functionResponse: {
          id: call.id,
          name: call.name,
          response: resultPayload,
        },
      })
    }

    if (!functionResponseParts.length) {
      return {
        answer:
          'I could not complete that FreshCart lookup. Please try rephrasing your question.',
        products: [...productsById.values()].slice(0, AI_LIMITS.ANSWER_PRODUCTS_MAX),
        toolsUsed,
        pendingConfirmation,
        cart: cartSnapshot,
      }
    }

    contents = [
      ...contents,
      {
        role: 'user',
        parts: functionResponseParts,
      },
    ]
  }

  if (!env.isProduction) {
    console.warn('[ai] Tool limit reached. Sequence:', toolsUsed.join(' -> '))
  }

  if (productsById.size) {
    return {
      answer: buildGroundedFallbackAnswer([...productsById.values()]),
      products: [...productsById.values()].slice(0, AI_LIMITS.ANSWER_PRODUCTS_MAX),
      toolsUsed,
      pendingConfirmation,
      cart: cartSnapshot,
    }
  }
  throw new ApiError(
    504,
    'The assistant needed too many FreshCart lookups for that question. Please narrow your search.',
    'AI_TOOL_LIMIT',
  )
}
