import {
  DEMO_CATEGORIES,
  DEMO_PRODUCTS,
  DEMO_REVIEWS,
} from '../data/demoData.js'

/**
 * PHASE 2 DEMO SERVICE.
 * Mimics async API calls so loading/empty/error states can be designed now.
 * Replace these functions with Axios calls to the Express API in Phase 3.
 */
const wait = (ms = 220) => new Promise((resolve) => setTimeout(resolve, ms))

const effectivePrice = (product) => product.discountPrice || product.price

const matchesSearch = (product, search = '') => {
  const term = search.trim().toLowerCase()
  if (!term) return true
  return [product.name, product.categoryName, product.description, product.brand]
    .join(' ')
    .toLowerCase()
    .includes(term)
}

const sortProducts = (items, sort = 'featured') => {
  const sorted = [...items]
  switch (sort) {
    case 'price-asc':
      return sorted.sort((a, b) => effectivePrice(a) - effectivePrice(b))
    case 'price-desc':
      return sorted.sort((a, b) => effectivePrice(b) - effectivePrice(a))
    case 'rating':
      return sorted.sort((a, b) => b.rating - a.rating)
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name))
    default:
      return sorted.sort((a, b) => {
        const scoreA = Number(b.featured) * 3 + Number(b.bestSeller) * 2 + b.rating
        const scoreB = Number(a.featured) * 3 + Number(a.bestSeller) * 2 + a.rating
        return scoreA - scoreB
      })
  }
}

export const getCategories = async () => {
  await wait(160)
  return DEMO_CATEGORIES.filter((category) => category.isActive)
}

export const getCategoryBySlug = async (slug) => {
  await wait(160)
  return DEMO_CATEGORIES.find((category) => category.slug === slug) || null
}

export const getProducts = async (params = {}) => {
  await wait()

  const {
    category,
    q = '',
    minPrice,
    maxPrice,
    availability = 'all',
    sort = 'featured',
    page = 1,
    limit = 8,
    ids,
  } = params

  let items = [...DEMO_PRODUCTS]

  if (Array.isArray(ids) && ids.length) {
    items = items.filter((product) => ids.includes(product.id))
  }
  if (category) {
    items = items.filter((product) => product.categoryId === category)
  }
  if (q) {
    items = items.filter((product) => matchesSearch(product, q))
  }
  if (minPrice !== undefined && minPrice !== '') {
    items = items.filter((product) => effectivePrice(product) >= Number(minPrice))
  }
  if (maxPrice !== undefined && maxPrice !== '') {
    items = items.filter((product) => effectivePrice(product) <= Number(maxPrice))
  }
  if (availability === 'in-stock') {
    items = items.filter((product) => product.stock > 0)
  }
  if (availability === 'low-stock') {
    items = items.filter((product) => product.stock > 0 && product.stock <= 20)
  }

  items = sortProducts(items, sort)

  const pageNumber = Math.max(Number(page) || 1, 1)
  const pageSize = Math.max(Number(limit) || 8, 1)
  const total = items.length
  const start = (pageNumber - 1) * pageSize

  return {
    items: items.slice(start, start + pageSize),
    total,
    page: pageNumber,
    limit: pageSize,
    pages: Math.max(Math.ceil(total / pageSize), 1),
  }
}

export const getProductById = async (id) => {
  await wait(180)
  return DEMO_PRODUCTS.find((product) => product.id === id || product.slug === id) || null
}

export const getReviewsByProduct = async (productId) => {
  await wait(140)
  return DEMO_REVIEWS.filter((review) => review.productId === productId)
}

export const getRelatedProducts = async (productId) => {
  await wait(180)
  const product = DEMO_PRODUCTS.find((item) => item.id === productId)
  if (!product) return []
  return DEMO_PRODUCTS.filter(
    (item) => item.categoryId === product.categoryId && item.id !== product.id,
  ).slice(0, 4)
}

export const getHomePageData = async () => {
  await wait(260)

  return {
    categories: DEMO_CATEGORIES.filter((category) => category.isActive).slice(0, 8),
    featured: DEMO_PRODUCTS.filter((product) => product.featured).slice(0, 8),
    deals: DEMO_PRODUCTS.filter((product) => product.dailyDeal).slice(0, 4),
    vegetables: DEMO_PRODUCTS.filter(
      (product) => product.categoryId === 'cat-vegetables',
    ).slice(0, 4),
    fruits: DEMO_PRODUCTS.filter((product) => product.categoryId === 'cat-fruits').slice(0, 4),
    bestSellers: DEMO_PRODUCTS.filter((product) => product.bestSeller).slice(0, 4),
  }
}

export const searchProducts = async (query, limit = 8) => {
  await wait(200)
  return sortProducts(
    DEMO_PRODUCTS.filter((product) => matchesSearch(product, query)),
  ).slice(0, limit)
}
