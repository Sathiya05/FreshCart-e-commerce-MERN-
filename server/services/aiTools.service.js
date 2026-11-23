import { env } from '../config/env.js'
import { AI_LIMITS, AI_TOOL_NAMES } from '../constants/ai.js'
import {
  addCartItem,
  DELIVERY_FEE,
  FREE_DELIVERY_THRESHOLD,
  getCart,
} from './cart.service.js'
import { findProductByIdentifier, listActiveCategories, listProducts } from './catalog.service.js'

const {
  SEARCH_PRODUCTS,
  GET_PRODUCT_DETAILS,
  CHECK_STOCK,
  RECOMMEND_PRODUCTS,
  LIST_CATEGORIES,
  VIEW_CART,
  ADD_TO_CART,
  GET_STORE_FAQS,
} = AI_TOOL_NAMES

const clamp = (value, min, max, fallback) => {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.min(max, Math.max(min, Math.trunc(number)))
}

const strictObject = (properties, required) => ({
  type: 'object',
  properties,
  required,
})

const formatMoney = (value) => `₹${Number(value || 0).toFixed(2)}`

/** Compact, customer-safe product payload used by the assistant and chat cards. */
const compactProduct = (product) => {
  const category =
    product.category && typeof product.category === 'object' ? product.category : null

  return {
    id: product.id || (product._id ? String(product._id) : undefined),
    name: product.name || '',
    slug: product.slug || '',
    sku: product.sku || '',
    price: Number(product.price) || 0,
    discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
    effectivePrice: Number(product.effectivePrice || product.discountPrice || product.price) || 0,
    stock: Number(product.stock) || 0,
    unit: product.unit || 'pcs',
    categoryName: product.categoryName || category?.name || '',
    categorySlug: product.categorySlug || category?.slug || '',
    image: product.image || product.images?.[0] || '',
    rating: Number(product.rating) || 0,
    featured: Boolean(product.featured),
    bestSeller: Boolean(product.bestSeller),
    dailyDeal: Boolean(product.dailyDeal),
  }
}

/** Prefer exact slug/ID lookup, then fall back to a live catalog name search. */
const resolveProduct = async (identifier) => {
  const normalized = String(identifier || '').trim()
  if (!normalized) return null

  const exact = await findProductByIdentifier(normalized)
  if (exact) return exact

  const page = await listProducts({ q: normalized, limit: 1, sort: 'featured' })
  const match = page.items[0]
  return match ? findProductByIdentifier(match.id) : null
}

const BASE_AI_TOOLS = [
  {
    name: SEARCH_PRODUCTS,
    description:
      'Search the live FreshCart catalog by product name, brand, tag, category, description, or price range. Use this for "show", "find", "available", "under ₹X", or category-based questions.',
    parameters: strictObject(
      {
        query: {
          type: 'string',
          description: 'Search text from the customer, e.g. "tomato" or "organic milk".',
        },
        limit: {
          type: 'integer',
          description: `Maximum products to return (1-${AI_LIMITS.SEARCH_LIMIT_MAX}). Use 4-6 for normal chat.`,
          minimum: 1,
          maximum: AI_LIMITS.SEARCH_LIMIT_MAX,
        },
        category: {
          type: 'string',
          description: 'Optional category slug or category ID to restrict the search.',
        },
        min_price: {
          type: 'number',
          description: 'Optional minimum effective price in INR.',
        },
        max_price: {
          type: 'number',
          description: 'Optional maximum effective price in INR.',
        },
        in_stock_only: {
          type: 'boolean',
          description: 'Set true when the customer only wants products currently in stock.',
        },
      },
      ['query'],
    ),
  },
  {
    name: GET_PRODUCT_DETAILS,
    description:
      'Get full details for one known product by its name, slug, or product ID. Use after a search when the customer asks for more information about a specific item.',
    parameters: strictObject(
      {
        identifier: {
          type: 'string',
          description: 'Product name, slug, or product ID returned by a previous catalog tool.',
        },
      },
      ['identifier'],
    ),
  },
  {
    name: CHECK_STOCK,
    description:
      'Check current stock for one specific product. Use for "is X available?", "do you have X?", or quantity availability questions.',
    parameters: strictObject(
      {
        identifier: {
          type: 'string',
          description: 'Product name, slug, or product ID returned by a previous catalog tool.',
        },
      },
      ['identifier'],
    ),
  },
  {
    name: RECOMMEND_PRODUCTS,
    description:
      'Recommend real FreshCart products from a category, optionally filtered by maximum price or stock. Use for "suggest", "recommend", "what should I buy", or "best" questions.',
    parameters: strictObject(
      {
        category: {
          type: 'string',
          description: 'Optional category slug or category ID.',
        },
        max_price: {
          type: 'number',
          description: 'Optional maximum effective price in INR.',
        },
        limit: {
          type: 'integer',
          description: `Maximum products to return (1-${AI_LIMITS.RECOMMEND_LIMIT_MAX}).`,
          minimum: 1,
          maximum: AI_LIMITS.RECOMMEND_LIMIT_MAX,
        },
        only_in_stock: {
          type: 'boolean',
          description: 'Set true to exclude out-of-stock products.',
        },
      },
      [],
    ),
  },
  {
    name: LIST_CATEGORIES,
    description:
      'List active FreshCart categories with their slugs. Use when a customer mentions a broad category name and you need the exact catalog category.',
    parameters: strictObject({}, []),
  },
  {
    name: GET_STORE_FAQS,
    description:
      'Get grounded FreshCart facts for delivery, payment, order, and pricing questions. Use this before answering any delivery slot, delivery charge, payment method, order status, or price-policy question.',
    parameters: strictObject({}, []),
  },
]

const CART_AI_TOOLS = [
  {
    name: VIEW_CART,
    description:
      'Read the signed-in customer’s current FreshCart cart, including item names, quantities, subtotal, delivery fee, and total. Use for "what is in my cart?", "how much is my cart?", or similar questions.',
    parameters: strictObject({}, []),
  },
  {
    name: ADD_TO_CART,
    description:
      'Add an available FreshCart product to the signed-in customer’s cart using the existing cart service. Use when the customer explicitly asks to add or buy a product.',
    parameters: strictObject(
      {
        identifier: {
          type: 'string',
          description: 'Product name, slug, or product ID returned by a previous catalog tool.',
        },
        quantity: {
          type: 'integer',
          description: `How many units to add (1-${AI_LIMITS.ADD_TO_CART_QUANTITY_MAX}).`,
          minimum: 1,
          maximum: AI_LIMITS.ADD_TO_CART_QUANTITY_MAX,
        },
      },
      ['identifier'],
    ),
  },
]

/** Cart tools are only exposed to authenticated customers. */
export const getAiTools = ({ user } = {}) => {
  const isCustomer = Boolean(user && (!user.role || user.role === 'customer'))
  return isCustomer ? [...BASE_AI_TOOLS, ...CART_AI_TOOLS] : BASE_AI_TOOLS
}

const searchProducts = async (args = {}) => {
  const query = {
    q: String(args.query || '').trim(),
    limit: clamp(args.limit, 1, AI_LIMITS.SEARCH_LIMIT_MAX, 6),
    sort: 'featured',
  }

  if (args.category) query.category = String(args.category).trim()
  if (args.min_price !== null && args.min_price !== undefined) {
    query.minPrice = Number(args.min_price)
  }
  if (args.max_price !== null && args.max_price !== undefined) {
    query.maxPrice = Number(args.max_price)
  }
  if (args.in_stock_only === true) query.availability = 'in-stock'

  const page = await listProducts(query)

  return {
    ok: true,
    total: page.total || 0,
    count: page.items.length,
    products: page.items.map(compactProduct),
  }
}

const getProductDetails = async (args = {}) => {
  const identifier = String(args.identifier || '').trim()
  if (!identifier) return { ok: false, error: 'A product identifier is required.' }

  const product = await resolveProduct(identifier)
  if (!product) {
    return { ok: true, found: false, message: 'No active FreshCart product matched that identifier.' }
  }

  return {
    ok: true,
    found: true,
    product: {
      ...compactProduct(product),
      description: product.description || product.shortDescription || '',
      tags: Array.isArray(product.tags) ? product.tags : [],
      images: Array.isArray(product.images) ? product.images : [],
    },
  }
}

const checkStock = async (args = {}) => {
  const identifier = String(args.identifier || '').trim()
  if (!identifier) return { ok: false, error: 'A product identifier is required.' }

  const product = await resolveProduct(identifier)
  if (!product) {
    return { ok: true, found: false, message: 'No active FreshCart product matched that identifier.' }
  }

  const stock = Number(product.stock) || 0

  return {
    ok: true,
    found: true,
    product: compactProduct(product),
    inStock: stock > 0,
    stock,
    message: stock > 0 ? `${stock} ${product.unit || 'pcs'} currently in stock.` : 'Currently out of stock.',
  }
}

const recommendProducts = async (args = {}) => {
  const query = {
    limit: clamp(args.limit, 1, AI_LIMITS.RECOMMEND_LIMIT_MAX, 5),
    sort: 'rating',
  }

  if (args.category) query.category = String(args.category).trim()
  if (args.max_price !== null && args.max_price !== undefined) {
    query.maxPrice = Number(args.max_price)
  }
  if (args.only_in_stock === true) query.availability = 'in-stock'

  const page = await listProducts(query)

  return {
    ok: true,
    total: page.total || 0,
    count: page.items.length,
    products: page.items.map(compactProduct),
  }
}

const listCategories = async () => {
  const categories = await listActiveCategories()

  return {
    ok: true,
    count: categories.length,
    categories: categories.map((category) => ({
      id: String(category._id),
      name: category.name || '',
      slug: category.slug || '',
      description: category.description || '',
    })),
  }
}

const summarizeCart = (cart) => ({
  ok: true,
  itemCount: cart.itemCount,
  itemLines: cart.items.length,
  subtotal: cart.subtotal,
  deliveryFee: cart.deliveryFee,
  totalAmount: cart.totalAmount,
  items: cart.items.map((item) => ({
    name: item.product?.name || '',
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    lineTotal: item.lineTotal,
  })),
})

const viewCart = async (_args = {}, context = {}) => {
  if (!context.user) {
    return { ok: false, error: 'The customer must sign in before asking about a cart.' }
  }

  const cart = await getCart(context.user._id || context.user.id)
  return {
    ...summarizeCart(cart),
    message: cart.itemCount
      ? `The cart has ${cart.itemCount} item(s), subtotal ${formatMoney(cart.subtotal)}, delivery ${formatMoney(cart.deliveryFee)}, and total ${formatMoney(cart.totalAmount)}.`
      : 'The cart is empty.',
  }
}

const addToCart = async (args = {}, context = {}) => {
  if (!context.user) {
    return { ok: false, error: 'The customer must sign in before adding products to a cart.' }
  }

  const identifier = String(args.identifier || '').trim()
  if (!identifier) return { ok: false, error: 'A product identifier is required.' }

  const quantity = clamp(
    args.quantity,
    1,
    AI_LIMITS.ADD_TO_CART_QUANTITY_MAX,
    1,
  )

  const product = await resolveProduct(identifier)
  if (!product) {
    return { ok: true, found: false, message: 'No active FreshCart product matched that identifier.' }
  }

  try {
    const cart = await addCartItem(context.user._id || context.user.id, product._id, quantity)
    return {
      ok: true,
      found: true,
      added: {
        name: product.name || '',
        quantity,
        effectivePrice: Number(product.effectivePrice || product.discountPrice || product.price) || 0,
      },
      addedProduct: compactProduct(product),
      ...summarizeCart(cart),
      message: `Added ${quantity} × ${product.name || 'product'} to the cart.`,
    }
  } catch (error) {
    return {
      ok: false,
      error: error?.message || 'That product could not be added to the cart right now.',
    }
  }
}

const getStoreFaqs = async () => {
  const facts = [
    {
      topic: 'shopping',
      answer:
        'FreshCart shows live catalog prices in INR. The cart and checkout pages recalculate the final total before an order is placed.',
    },
    {
      topic: 'delivery',
      answer: `Delivery slots are selected at checkout and availability depends on the customer's location. Free delivery applies when the cart subtotal is ${formatMoney(FREE_DELIVERY_THRESHOLD)} or more; otherwise a ${formatMoney(DELIVERY_FEE)} delivery fee is added to the cart total.`,
    },
    {
      topic: 'payments',
      answer: env.razorpayConfigured
        ? 'Cash on delivery is available. Razorpay-powered UPI, card, and net-banking payments are available at checkout when enabled, and payments are verified on the server before the order is confirmed. FreshCart does not store card details.'
        : 'Cash on delivery is available. Online UPI, card, and net-banking payments are not enabled for this store right now.',
    },
    {
      topic: 'orders',
      answer:
        'After checkout, order status can be tracked in the orders area. Delivery slots shown at checkout are subject to availability.',
    },
  ]

  return { ok: true, facts }
}

const handlers = {
  [SEARCH_PRODUCTS]: searchProducts,
  [GET_PRODUCT_DETAILS]: getProductDetails,
  [CHECK_STOCK]: checkStock,
  [RECOMMEND_PRODUCTS]: recommendProducts,
  [LIST_CATEGORIES]: listCategories,
  [VIEW_CART]: viewCart,
  [ADD_TO_CART]: addToCart,
  [GET_STORE_FAQS]: getStoreFaqs,
}

export const executeAiTool = async (name, args = {}, context = {}) => {
  const handler = handlers[name]
  if (!handler) {
    return { ok: false, error: 'Unsupported FreshCart tool.' }
  }

  try {
    return await handler(args, context)
  } catch (error) {
    console.error(`[ai] Tool ${name} failed:`, error?.message || error)
    return {
      ok: false,
      error: 'FreshCart information is temporarily unavailable. Tell the customer to try again; do not guess.',
    }
  }
}
