import api, { getApiErrorMessage } from './api.js'
import { normalizeProduct } from './catalog.service.js'

const getData = (response) => response.data.data

/** Non-secret status only: never expose the API key or full env to the browser. */
export const getAiStatus = async () => {
  try {
    return await api.get('/ai/status').then(getData)
  } catch {
    return { configured: false, provider: 'none', model: '', error: true }
  }
}

export const askAssistant = async ({ message, history = [], confirmation } = {}) => {
  try {
    const data = await api
      .post('/ai/chat', { message, history, confirmation })
      .then(getData)

    return {
      answer: data?.answer || '',
      products: (data?.products || []).map(normalizeProduct),
      toolsUsed: data?.toolsUsed || [],
      pendingConfirmation: data?.pendingConfirmation || null,
      cart: data?.cart
        ? {
            ...data.cart,
            items: (data.cart.items || []).map((item) => ({
              ...item,
              product: normalizeProduct(item.product),
            })),
          }
        : null,
    }
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'The assistant is unavailable right now.'))
  }
}
