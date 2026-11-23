import { AI_LIMITS, AI_TOOL_NAMES } from '../constants/ai.js'
import { findProductByIdentifier, listActiveCategories, listProducts } from './catalog.service.js'

const { SEARCH_PRODUCTS, GET_PRODUCT_DETAILS, CHECK_STOCK, RECOMMEND_PRODUCTS, LIST_CATEGORIES } =
  AI_TOOL_NAMES

const clamp = (value, min, max, fallback) => {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.min(max, Math.max(min, Math.trunc(number)))
}

const nullableString = (description) => ({
  type: ['string', 'null'],
  description,
})

const nullableNumber = (description) => ({
  type: ['number', 'null'],
  description,
})

const strictObject = (properties, required) => ({
  type: 'object',
  properties,
  required,
  additionalProperties: false,
})

/** Compact, customer-safe product payload used by the assistant and chat cards. */
const compactProduct = (product) => ({
  id: product.id,
  name: product.name || '',
  slug: product.slug || '',
  sku: product.sku || '',
  price: Number(product.price) || 0,
  discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
  effectivePrice: Number(product.effectivePrice || product.discountPrice || product.price) || 0,
  stock: Number(product.stock) || 0,
  unit: product.unit || 'pcs',
  categoryName: product.categoryName || '',
  categorySlug: product.categorySlug || '',
  image: product.image || product.images?.[0] || '',
  rating: Number(product.rating) || 0,
  featured: Boolean(product.featured),
  bestSeller: Boolean(product.bestSeller),
  dailyDeal: Boolean(product.dailyDeal),
})

export const AI_TOOLS = [
  {
    name: SEARCH_PRODUCTS,
    description:
      'Search the live FreshCart catalog by product name, brand, tag, category, description, or price range. Use this for "show", "find", "available", "under ₹X", or category-based questions.',
    parameters: strictObject(
      {
        query: { type: 'string', description: 'Search text from the customer, e.g. "tomato" or "organic milk".' },
        limit: {
          type: 'integer',
          description: `Maximum products to return (1-${AI_LIMITS.SEARCH_LIMIT_MAX}). Use 4-6 for normal chat.`,
        },
        category: nullableString('Optional category slug or category ID to restrict the search.'),
        min_price: nullableNumber('Optional minimum effective price in INR.'),
        max_price: nullableNumber('Optional maximum effective price in INR.'),
        in_stock_only: {
          type: 'boolean',
          description: 'Set true when the customer only wants products currently in stock.',
        },
      },
      ['query', 'limit', 'category', 'min_price', 'max_price', 'in_stock_only'],
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
        category: nullableString('Optional category slug or category ID.'),
        max_price: nullableNumber('Optional maximum effective price in INR.'),
        limit: {
          type: 'integer',
          description: `Maximum products to return (1-${AI_LIMITS.RECOMMEND_LIMIT_MAX}).`,
        },
        only_in_stock: {
          type: 'boolean',
          description: 'Set true to exclude out-of-stock products.',
        },
      },
      ['category', 'max_price', 'limit', 'only_in_stock'],
    ),
  },
  {
    name: LIST_CATEGORIES,
    description:
      'List active FreshCart categories with their slugs. Use when a customer mentions a broad category name and you need the exact catalog category.',
    parameters: strictObject({}, []),
  },
]

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

  const product = await findProductByIdentifier(identifier)
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

  const product = await findProductByIdentifier(identifier)
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

const handlers = {
  [SEARCH_PRODUCTS]: searchProducts,
  [GET_PRODUCT_DETAILS]: getProductDetails,
  [CHECK_STOCK]: checkStock,
  [RECOMMEND_PRODUCTS]: recommendProducts,
  [LIST_CATEGORIES]: listCategories,
}

export const executeAiTool = async (name, args = {}) => {
  const handler = handlers[name]
  if (!handler) {
    return { ok: false, error: 'Unsupported catalog tool.' }
  }

  try {
    return await handler(args)
  } catch (error) {
    console.error(`[ai] Tool ${name} failed:`, error?.message || error)
    return {
      ok: false,
      error: 'Catalog lookup is temporarily unavailable. Tell the customer to try again; do not guess.',
    }
  }
}
