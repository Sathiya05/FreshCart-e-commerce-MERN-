import { AI_LIMITS, AI_TOOL_NAMES } from '../constants/ai.js'
import {
  addCartItem,
  clearCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from './cart.service.js'
import { findProductByIdentifier, listActiveCategories, listProducts } from './catalog.service.js'
import { getCustomerOrderByIdentifier, listUserOrders } from './order.service.js'
import { getStoreFaqFacts } from './storeFaq.service.js'
import {
  consumeCartConfirmationToken,
  createCartConfirmationToken,
  verifyCartConfirmationToken,
} from '../utils/confirmation.js'

const {
  SEARCH_PRODUCTS,
  GET_PRODUCT_DETAILS,
  CHECK_STOCK,
  RECOMMEND_PRODUCTS,
  LIST_CATEGORIES,
  VIEW_CART,
  PREPARE_CART_CHANGE,
  ADD_TO_CART,
  UPDATE_CART_ITEM,
  REMOVE_CART_ITEM,
  CLEAR_CART,
  GET_MY_ORDERS,
  GET_ORDER_DETAILS,
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

/** Map everyday shopping words to live catalog categories, not to products. */
const CATEGORY_WORD_PATTERNS = [
  { words: ['vegetable', 'vegetables', 'veg'], pattern: /vegetable|veg/i },
  { words: ['fruit', 'fruits'], pattern: /fruit/i },
  { words: ['dairy', 'milk', 'eggs'], pattern: /dairy|milk|egg/i },
  { words: ['grain', 'grains', 'rice', 'cereals'], pattern: /grain|rice|cereal/i },
  { words: ['bakery', 'bread'], pattern: /bakery|bread/i },
  { words: ['meat', 'seafood', 'chicken', 'fish'], pattern: /meat|seafood|chicken|fish/i },
  { words: ['beverage', 'beverages', 'drinks', 'juice'], pattern: /beverage|drink|juice/i },
  { words: ['snack', 'snacks'], pattern: /snack/i },
]

const GENERIC_QUERY_WORDS = new Set([
  'all',
  'item',
  'items',
  'product',
  'products',
  'groceries',
  'grocery',
  'available products',
])

const STOCK_INTENT_PATTERN = /\b(in stock|currently in stock|available|availability|stock)\b/i

const stripStockIntent = (value) =>
  String(value || '')
    .replace(/\b(in stock|currently in stock|available|availability|stock)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const resolveCategoryWord = async (query) => {
  const normalized = String(query || '').trim().toLowerCase()
  const tokens = normalized.split(/[^a-z]+/).filter(Boolean)
  const entry = CATEGORY_WORD_PATTERNS.find((item) =>
    item.words.some((word) => tokens.includes(word)),
  )
  if (!entry) return null

  const categories = await listActiveCategories()
  const category = categories.find(
    (item) => entry.pattern.test(item.name || '') || entry.pattern.test(item.slug || ''),
  )
  if (!category) return null

  const categoryTokens = new Set(entry.words)
  return {
    id: String(category.slug || category._id),
    isBroad: tokens.every((token) => categoryTokens.has(token)),
  }
}

const getUserId = (context = {}) =>
  String(context.user?._id || context.user?.id || '')

const requireCustomer = (context = {}) => {
  if (!getUserId(context)) {
    return { ok: false, error: 'The customer must sign in before using this tool.' }
  }
  if (context.user?.role && context.user.role !== 'customer') {
    return { ok: false, error: 'This tool is available to customer accounts only.' }
  }
  return null
}

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
const resolveProduct = async (identifier, { allowInactive = false } = {}) => {
  const normalized = String(identifier || '').trim()
  if (!normalized) return null

  const exact = await findProductByIdentifier(normalized, { allowInactive })
  if (exact) return exact

  const page = await listProducts({ q: normalized, limit: 1, sort: 'featured' })
  const match = page.items[0]
  return match ? findProductByIdentifier(match.id, { allowInactive }) : null
}

const findCartItem = (cart, identifier) => {
  const normalized = String(identifier || '').trim().toLowerCase()
  if (!normalized) return null

  return (
    cart.items.find((item) => {
      const product = item.product || {}
      return [
        product.id,
        product._id,
        product.slug,
        product.sku,
        product.name,
      ]
        .map((value) => String(value || '').trim().toLowerCase())
        .filter(Boolean)
        .includes(normalized)
    }) || null
  )
}

const BASE_AI_TOOLS = [
  {
    name: SEARCH_PRODUCTS,
    description:
      'Search the live FreshCart catalog by product name, brand, tag, category, description, or price range. Everyday category words such as vegetables, fruits or dairy are mapped to live categories automatically. Use this for "show", "find", "available", "under ₹X", or category-based questions.',
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
      'Get grounded FreshCart facts for delivery, payment, order, support, and pricing questions. Use this before answering any delivery slot, delivery charge, payment method, order status, support, or price-policy question.',
    parameters: strictObject({}, []),
  },
]

const CUSTOMER_AI_TOOLS = [
  {
    name: VIEW_CART,
    description:
      'Read the signed-in customer’s current FreshCart cart, including item names, quantities, subtotal, delivery fee, and total. Use for "what is in my cart?", "how much is my cart?", or similar questions.',
    parameters: strictObject({}, []),
  },
  {
    name: PREPARE_CART_CHANGE,
    description:
      'Prepare and summarize a cart change, including price and stock checks. This NEVER changes the cart. Always call this first before adding, changing, removing, or clearing cart items, then ask the customer to confirm. FreshCart commits the change automatically when the customer confirms.',
    parameters: strictObject(
      {
        action: {
          type: 'string',
          enum: ['add', 'update', 'remove', 'clear'],
          description: 'The cart change being requested.',
        },
        identifier: {
          type: 'string',
          description: 'Product name, slug, or ID. Required for add, update and remove.',
        },
        quantity: {
          type: 'integer',
          description: `Target quantity for add or update (1-${AI_LIMITS.CART_QUANTITY_MAX}).`,
          minimum: 1,
          maximum: AI_LIMITS.CART_QUANTITY_MAX,
        },
      },
      ['action'],
    ),
  },
  {
    name: GET_MY_ORDERS,
    description:
      'Read the signed-in customer’s recent orders in a read-only, compact form. Use for "my orders", "order status", or "track my order" questions.',
    parameters: strictObject({}, []),
  },
  {
    name: GET_ORDER_DETAILS,
    description:
      'Read one signed-in customer’s order by order number or ID in a read-only, compact form. Never use another customer’s identifier.',
    parameters: strictObject(
      {
        identifier: {
          type: 'string',
          description: 'FreshCart order number or order ID supplied by the signed-in customer.',
        },
      },
      ['identifier'],
    ),
  },
]

/** Cart and order tools are only exposed to authenticated customers. */
export const getAiTools = ({ user } = {}) => {
  const isCustomer = Boolean(user && (!user.role || user.role === 'customer'))
  return isCustomer ? [...BASE_AI_TOOLS, ...CUSTOMER_AI_TOOLS] : BASE_AI_TOOLS
}

const searchProducts = async (args = {}) => {
  const originalQuery = String(args.query || '').trim()
  const normalizedQuery = stripStockIntent(originalQuery)
  const hasStockIntent = STOCK_INTENT_PATTERN.test(originalQuery)
  const queryText = normalizedQuery || originalQuery
  const query = {
    limit: clamp(args.limit, 1, AI_LIMITS.SEARCH_LIMIT_MAX, 6),
    sort: 'featured',
  }

  const categoryFromWord = await resolveCategoryWord(queryText)
  const isGenericQuery = !normalizedQuery || GENERIC_QUERY_WORDS.has(queryText.toLowerCase())

  if (!isGenericQuery && (!categoryFromWord || !categoryFromWord.isBroad)) {
    query.q = queryText
  }
  if (args.category) query.category = String(args.category).trim()
  else if (categoryFromWord) query.category = categoryFromWord.id
  if (args.min_price !== null && args.min_price !== undefined) {
    query.minPrice = Number(args.min_price)
  }
  if (args.max_price !== null && args.max_price !== undefined) {
    query.maxPrice = Number(args.max_price)
  }
  if (hasStockIntent || args.in_stock_only === true) query.availability = 'in-stock'

  let page = await listProducts(query)

  // A brand/product phrase may not match exactly, but its category word can
  // still provide useful, live alternatives (e.g. "Amul Milk" -> dairy).
  if (!page.items.length && categoryFromWord && !categoryFromWord.isBroad) {
    const fallback = { ...query }
    delete fallback.q
    page = await listProducts(fallback)
  }

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
    const alternatives = await searchProducts({ query: identifier, limit: 4 })
    return {
      ok: true,
      found: false,
      alternatives: alternatives.products || [],
      message: alternatives.products?.length
        ? `No exact match for ${identifier}. Here are live alternatives from the same category.`
        : 'No active FreshCart product matched that identifier.',
    }
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
    product: compactProduct(item.product || {}),
    name: item.product?.name || '',
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    lineTotal: item.lineTotal,
  })),
})

const viewCart = async (_args = {}, context = {}) => {
  const missingUser = requireCustomer(context)
  if (missingUser) return missingUser

  const cart = await getCart(getUserId(context))
  return {
    ...summarizeCart(cart),
    message: cart.itemCount
      ? `The cart has ${cart.itemCount} item(s), subtotal ${formatMoney(cart.subtotal)}, delivery ${formatMoney(cart.deliveryFee)}, and total ${formatMoney(cart.totalAmount)}.`
      : 'The cart is empty.',
  }
}

const prepareCartChange = async (args = {}, context = {}) => {
  const missingUser = requireCustomer(context)
  if (missingUser) return missingUser

  const action = String(args.action || '').trim().toLowerCase()
  if (!['add', 'update', 'remove', 'clear'].includes(action)) {
    return { ok: false, error: 'Choose add, update, remove, or clear.' }
  }

  const userId = getUserId(context)
  const cart = await getCart(userId)
  const identifier = String(args.identifier || '').trim()
  let product = null
  let existingItem = null
  let quantity = 0

  if (action === 'clear') {
    if (!cart.itemCount) return { ok: true, changed: false, message: 'The cart is already empty.' }
  } else {
    if (!identifier) return { ok: false, error: 'A product identifier is required.' }

    if (action === 'remove') {
      existingItem = findCartItem(cart, identifier)
      if (!existingItem) {
        return { ok: true, found: false, message: 'That product is not in the cart.' }
      }
      product = existingItem.product
    } else {
      product = await resolveProduct(identifier)
      if (!product) {
        return { ok: true, found: false, message: 'No active FreshCart product matched that identifier.' }
      }
      if (!product.isActive) {
        return { ok: false, error: 'That product is no longer available.' }
      }
      existingItem = cart.items.find(
        (item) => String(item.product?.id) === String(product.id || product._id),
      )
    }

    quantity = clamp(args.quantity, 1, AI_LIMITS.CART_QUANTITY_MAX, 1)

    if (action === 'add') {
      const requested = (existingItem?.quantity || 0) + quantity
      if (Number(product.stock) < requested) {
        return {
          ok: false,
          error: `Only ${Number(product.stock) || 0} are available in stock.`,
        }
      }
    } else if (action === 'update' && Number(product.stock) < quantity) {
      return {
        ok: false,
        error: `Only ${Number(product.stock) || 0} are available in stock.`,
      }
    }
  }

  const productId = product ? String(product.id || product._id || '') : ''
  const tokenQuantity = action === 'add' || action === 'update' ? quantity : 0
  const confirmationToken = createCartConfirmationToken({
    userId,
    action,
    productId,
    quantity: tokenQuantity,
  })

  const summaries = {
    add: `Add ${quantity} × ${product.name} (${formatMoney(product.effectivePrice || product.price)} each) to your cart.`,
    update: `Change ${product.name} in your cart to quantity ${quantity}.`,
    remove: `Remove ${product.name} from your cart.`,
    clear: `Remove all ${cart.itemCount} item(s) from your cart.`,
  }

  return {
    ok: true,
    needsConfirmation: true,
    confirmationToken,
    action,
    productId,
    quantity: tokenQuantity,
    product: product ? compactProduct(product) : undefined,
    cart: summarizeCart(cart),
    summary: summaries[action],
    message: `Ask the customer to confirm: ${summaries[action]}`,
  }
}

const assertConfirmation = async (args, context, expected) => {
  const missingUser = requireCustomer(context)
  if (missingUser) return missingUser

  if (context.confirmation?.confirmed !== true) {
    return { ok: false, error: 'The customer has not confirmed this cart change.' }
  }

  const token = String(args.confirmation_token || context.confirmation?.token || '')
  if (!token) {
    return { ok: false, error: 'A confirmation is required before changing the cart.' }
  }

  const payload = verifyCartConfirmationToken(token, {
    userId: getUserId(context),
    ...expected,
  })
  if (!payload) {
    return { ok: false, error: 'That confirmation is missing or has expired. Prepare the change again.' }
  }

  const consumed = await consumeCartConfirmationToken(token)
  if (!consumed) {
    return { ok: false, error: 'That confirmation was already used. Prepare the change again.' }
  }

  return { ok: true, payload }
}

const addToCart = async (args = {}, context = {}) => {
  const identifier = String(args.identifier || '').trim()
  const quantity = clamp(args.quantity, 1, AI_LIMITS.CART_QUANTITY_MAX, 1)
  const product = identifier ? await resolveProduct(identifier) : null
  const productId = product ? String(product.id || product._id || '') : ''

  const confirmation = await assertConfirmation(args, context, {
    action: 'add',
    productId,
    quantity,
  })
  if (!confirmation.ok) return confirmation
  if (!product) {
    return { ok: true, found: false, message: 'No active FreshCart product matched that identifier.' }
  }

  try {
    const cart = await addCartItem(getUserId(context), product._id, quantity)
    return {
      ok: true,
      found: true,
      confirmed: true,
      added: {
        name: product.name || '',
        quantity,
        effectivePrice: Number(product.effectivePrice || product.discountPrice || product.price) || 0,
      },
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

const updateCartItemTool = async (args = {}, context = {}) => {
  const identifier = String(args.identifier || '').trim()
  const quantity = clamp(args.quantity, 1, AI_LIMITS.CART_QUANTITY_MAX, 1)
  const product = identifier ? await resolveProduct(identifier) : null
  const productId = product ? String(product.id || product._id || '') : ''

  const confirmation = await assertConfirmation(args, context, {
    action: 'update',
    productId,
    quantity,
  })
  if (!confirmation.ok) return confirmation
  if (!product) {
    return { ok: true, found: false, message: 'No active FreshCart product matched that identifier.' }
  }

  try {
    const cart = await updateCartItem(getUserId(context), product._id, quantity)
    return {
      ok: true,
      found: true,
      confirmed: true,
      ...summarizeCart(cart),
      message: `Updated ${product.name} to quantity ${quantity} in the cart.`,
    }
  } catch (error) {
    return { ok: false, error: error?.message || 'That cart item could not be updated.' }
  }
}

const removeCartItemTool = async (args = {}, context = {}) => {
  const identifier = String(args.identifier || '').trim()
  const missingUser = requireCustomer(context)
  if (missingUser) return missingUser

  const cart = await getCart(getUserId(context))
  const item = findCartItem(cart, identifier)
  const product = item?.product
  const productId = product ? String(product.id || product._id || '') : ''

  const confirmation = await assertConfirmation(args, context, {
    action: 'remove',
    productId,
    quantity: 0,
  })
  if (!confirmation.ok) return confirmation
  if (!product) {
    return { ok: true, found: false, message: 'That product is not in the cart.' }
  }

  try {
    const updated = await removeCartItem(getUserId(context), product._id || product.id)
    return {
      ok: true,
      found: true,
      confirmed: true,
      ...summarizeCart(updated),
      message: `Removed ${product.name} from the cart.`,
    }
  } catch (error) {
    return { ok: false, error: error?.message || 'That cart item could not be removed.' }
  }
}

const clearCartTool = async (args = {}, context = {}) => {
  const confirmation = await assertConfirmation(args, context, {
    action: 'clear',
    productId: '',
    quantity: 0,
  })
  if (!confirmation.ok) return confirmation

  try {
    const cart = await clearCart(getUserId(context))
    return {
      ok: true,
      confirmed: true,
      ...summarizeCart(cart),
      message: 'Your cart has been cleared.',
    }
  } catch (error) {
    return { ok: false, error: error?.message || 'The cart could not be cleared.' }
  }
}

const compactOrder = (order, { detailed = false } = {}) => {
  const base = {
    id: order.id,
    orderNumber: order.orderNumber,
    date: order.date,
    status: order.status,
    paymentStatus: order.paymentStatus,
    itemCount: order.itemCount,
    totalAmount: order.totalAmount,
    deliveryDate: order.deliveryDate || '',
    deliverySlot: order.deliverySlot || '',
  }

  if (!detailed) return base

  return {
    ...base,
    deliveryInstructions: order.deliveryInstructions || '',
    address: order.address
      ? {
          city: order.address.city || '',
          state: order.address.state || '',
          pincode: order.address.pincode || '',
        }
      : null,
    items: (order.items || []).slice(0, 6).map((item) => ({
      name: item.name || '',
      quantity: item.quantity,
      price: item.price,
      lineTotal: item.lineTotal,
    })),
  }
}

const getMyOrders = async (_args = {}, context = {}) => {
  const missingUser = requireCustomer(context)
  if (missingUser) return missingUser

  const page = await listUserOrders(getUserId(context), { limit: 5 })
  return {
    ok: true,
    count: page.items.length,
    orders: page.items.map((order) => compactOrder(order)),
    message: page.items.length
      ? `The customer has ${page.total || page.items.length} order(s); showing the most recent ${page.items.length}.`
      : 'No orders have been placed yet.',
  }
}

const getOrderDetails = async (args = {}, context = {}) => {
  const missingUser = requireCustomer(context)
  if (missingUser) return missingUser

  const identifier = String(args.identifier || '').trim()
  if (!identifier) return { ok: false, error: 'An order number or ID is required.' }

  try {
    const order = await getCustomerOrderByIdentifier(getUserId(context), identifier)
    return {
      ok: true,
      found: true,
      order: compactOrder(order, { detailed: true }),
    }
  } catch (error) {
    if (error?.code === 'NOT_FOUND') {
      return { ok: true, found: false, message: 'No matching order was found for this account.' }
    }
    throw error
  }
}

const getStoreFaqs = async () => getStoreFaqFacts()

const handlers = {
  [SEARCH_PRODUCTS]: searchProducts,
  [GET_PRODUCT_DETAILS]: getProductDetails,
  [CHECK_STOCK]: checkStock,
  [RECOMMEND_PRODUCTS]: recommendProducts,
  [LIST_CATEGORIES]: listCategories,
  [VIEW_CART]: viewCart,
  [PREPARE_CART_CHANGE]: prepareCartChange,
  [ADD_TO_CART]: addToCart,
  [UPDATE_CART_ITEM]: updateCartItemTool,
  [REMOVE_CART_ITEM]: removeCartItemTool,
  [CLEAR_CART]: clearCartTool,
  [GET_MY_ORDERS]: getMyOrders,
  [GET_ORDER_DETAILS]: getOrderDetails,
  [GET_STORE_FAQS]: getStoreFaqs,
}

const INTERNAL_CART_TOOLS = new Set([
  ADD_TO_CART,
  UPDATE_CART_ITEM,
  REMOVE_CART_ITEM,
  CLEAR_CART,
])

export const executeAiTool = async (
  name,
  args = {},
  context = {},
  { allowInternal = false } = {},
) => {
  const declared = new Set(getAiTools(context).map((tool) => tool.name))
  const isInternal = INTERNAL_CART_TOOLS.has(name)
  const handler = handlers[name]

  // Cart commit tools are never advertised to Gemini. They are reachable only
  // through the signed, explicitly approved out-of-band confirmation path.
  if (!handler || (!declared.has(name) && !(isInternal && allowInternal))) {
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
