import api from './api.js'

/**
 * Public catalog service backed by the Phase 3 REST API.
 *
 * The server returns Mongoose-friendly fields (`images`, `category`, etc.).
 * These mappers adapt them to the simpler shape used by the existing UI cards.
 */
const getData = (response) => response.data.data

const pickBadge = (product) => {
  if (product.dailyDeal) return 'Daily deal'
  if (product.bestSeller) return 'Best seller'
  if (product.featured) return 'Featured'
  return null
}

export const normalizeProduct = (product = {}) => ({
  ...product,
  id: product.id,
  image: product.image || product.images?.[0] || '',
  images: product.images || (product.image ? [product.image] : []),
  categoryId: product.categoryId || product.category || '',
  categoryName: product.categoryName || '',
  categorySlug: product.categorySlug || '',
  badge: product.badge || pickBadge(product),
  rating: Number(product.rating) || 0,
  reviewCount: Number(product.reviewCount) || 0,
  stock: Number(product.stock) || 0,
  price: Number(product.price) || 0,
  discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
  effectivePrice: Number(
    product.effectivePrice || product.discountPrice || product.price || 0,
  ),
})

export const normalizeCategory = (category = {}) => ({
  ...category,
  id: category.id,
  shortName: category.shortName || category.name,
  image: category.image || '',
  icon: category.icon || 'Carrot',
})

const normalizeProductPage = (page = {}) => ({
  ...page,
  items: (page.items || []).map(normalizeProduct),
})

const buildQuery = (params = {}) => {
  const query = {}
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '' || value === 'all') continue
    query[key] = Array.isArray(value) ? value.join(',') : value
  }
  return query
}

export const getCategories = async () => {
  const categories = await api.get('/categories').then(getData)
  return categories.map(normalizeCategory)
}

export const getCategoryBySlug = async (slug) => {
  try {
    const category = await api.get(`/categories/${encodeURIComponent(slug)}`).then(getData)
    return normalizeCategory(category)
  } catch (error) {
    if (error.response?.status === 404) return null
    throw error
  }
}

export const getProducts = async (params = {}) => {
  const page = await api.get('/products', { params: buildQuery(params) }).then(getData)
  return normalizeProductPage(page)
}

export const getProductById = async (id) => {
  try {
    const product = await api.get(`/products/${encodeURIComponent(id)}`).then(getData)
    return normalizeProduct(product)
  } catch (error) {
    if (error.response?.status === 404) return null
    throw error
  }
}

/** Reviews are not part of the Phase 3 API; empty means "not available yet". */
export const getReviewsByProduct = async () => []

export const getRelatedProducts = async (productId) => {
  const product = await getProductById(productId)
  if (!product) return []

  const params = product.categoryId
    ? { category: product.categoryId, limit: 5 }
    : product.categorySlug
      ? { categorySlug: product.categorySlug, limit: 5 }
      : { limit: 5 }

  const page = await getProducts(params)
  return page.items.filter((item) => item.id !== product.id).slice(0, 4)
}

export const getHomePageData = async () => {
  const [categories, featured, deals, vegetables, fruits, bestSellers] = await Promise.all([
    getCategories(),
    getProducts({ featured: true, limit: 8 }),
    getProducts({ dailyDeal: true, limit: 4 }),
    getProducts({ categorySlug: 'vegetables', limit: 4 }),
    getProducts({ categorySlug: 'fruits', limit: 4 }),
    getProducts({ bestSeller: true, limit: 4 }),
  ])

  return {
    categories: categories.slice(0, 8),
    featured: featured.items,
    deals: deals.items,
    vegetables: vegetables.items,
    fruits: fruits.items,
    bestSellers: bestSellers.items,
  }
}

export const searchProducts = async (query, limit = 8) => {
  const page = await getProducts({ q: query, limit })
  return page.items
}
