import mongoose from 'mongoose'
import { Category } from '../models/Category.js'
import { Product } from '../models/Product.js'
import { User } from '../models/User.js'
import { escapeRegex } from '../utils/slugify.js'
import { buildPagination, parsePositiveInt } from '../utils/pagination.js'
import { serializeProduct } from '../utils/serialize.js'
import { getOrderStats, getRecentOrders } from './report.service.js'

const { ObjectId } = mongoose.Types

const isValidId = (value) => ObjectId.isValid(String(value))

const sortMap = {
  featured: { featured: -1, bestSeller: -1, rating: -1, createdAt: -1 },
  'price-asc': { effectivePrice: 1 },
  'price-desc': { effectivePrice: -1 },
  rating: { rating: -1, reviewCount: -1 },
  name: { name: 1 },
  newest: { createdAt: -1 },
}

const emptyResult = (page, limit) => ({
  items: [],
  ...buildPagination(0, page, limit),
})

const addRangeExpression = (expressions, value, operator) => {
  if (value === undefined || value === null || value === '') return
  const number = Number(value)
  if (!Number.isFinite(number)) return
  expressions.push({
    $expr: {
      [operator]: [
        { $ifNull: ['$discountPrice', '$price'] },
        number,
      ],
    },
  })
}

export const findCategoryBySlug = (slug) =>
  Category.findOne({ slug: String(slug).toLowerCase() }).lean()

export const listActiveCategories = () =>
  Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean()

export const listProducts = async (query = {}, { allowInactive = false } = {}) => {
  const page = parsePositiveInt(query.page, 1, { min: 1, max: 100000 })
  const limit = parsePositiveInt(query.limit, 12, { min: 1, max: 60 })
  const match = {}

  if (!allowInactive) {
    match.isActive = true
  } else if (query.status === 'active') {
    match.isActive = true
  } else if (query.status === 'inactive') {
    match.isActive = false
  }

  const search = String(query.q || '').trim()
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i')
    match.$or = [
      { name: regex },
      { description: regex },
      { shortDescription: regex },
      { brand: regex },
      { tags: regex },
    ]
  }

  const categoryValue = query.category || query.categorySlug
  if (categoryValue) {
    if (isValidId(categoryValue)) {
      match.category = new ObjectId(String(categoryValue))
    } else {
      const category = await findCategoryBySlug(categoryValue)
      if (!category) return emptyResult(page, limit)
      match.category = category._id
    }
  }

  if (query.ids) {
    const ids = String(query.ids)
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)
    const validIds = ids.filter(isValidId).map((id) => new ObjectId(id))
    if (!validIds.length) return emptyResult(page, limit)
    match._id = { $in: validIds }
  }

  const priceExpressions = []
  addRangeExpression(priceExpressions, query.minPrice, '$gte')
  addRangeExpression(priceExpressions, query.maxPrice, '$lte')
  if (priceExpressions.length) match.$and = priceExpressions

  if (query.availability === 'in-stock') {
    match.stock = { $gt: 0 }
  } else if (query.availability === 'low-stock') {
    match.$expr = {
      $and: [
        { $gt: ['$stock', 0] },
        { $lte: ['$stock', { $ifNull: ['$lowStockThreshold', 20] }] },
      ],
    }
  }

  for (const field of ['featured', 'bestSeller', 'dailyDeal']) {
    if (query[field] === 'true' || query[field] === true) match[field] = true
    if (query[field] === 'false' || query[field] === false) match[field] = false
  }

  const sort = sortMap[query.sort] || sortMap.featured

  const [result] = await Product.aggregate([
    { $match: match },
    {
      $lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'categoryDoc',
      },
    },
    { $unwind: { path: '$categoryDoc', preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        effectivePrice: { $ifNull: ['$discountPrice', '$price'] },
        categoryName: '$categoryDoc.name',
        categorySlug: '$categoryDoc.slug',
      },
    },
    { $sort: sort },
    {
      $facet: {
        items: [{ $skip: (page - 1) * limit }, { $limit: limit }],
        meta: [{ $count: 'total' }],
      },
    },
  ])

  const items = (result?.items || []).map(serializeProduct)
  const total = result?.meta?.[0]?.total || 0

  return { items, ...buildPagination(total, page, limit) }
}

export const findProductByIdentifier = async (identifier, { allowInactive = false } = {}) => {
  const filter = allowInactive ? {} : { isActive: true }
  if (isValidId(identifier)) {
    filter._id = new ObjectId(String(identifier))
  } else {
    filter.slug = String(identifier).toLowerCase()
  }

  return Product.findOne(filter)
    .populate('category', 'name slug isActive')
    .lean()
}

export const getAdminOverview = async () => {
  const [
    products,
    activeProducts,
    categories,
    customers,
    lowStock,
    outOfStock,
    orderStats,
    recentOrders,
  ] = await Promise.all([
    Product.countDocuments(),
    Product.countDocuments({ isActive: true }),
    Category.countDocuments(),
    User.countDocuments({ role: 'customer' }),
    Product.countDocuments({
      $expr: {
        $and: [
          { $gt: ['$stock', 0] },
          { $lte: ['$stock', { $ifNull: ['$lowStockThreshold', 20] }] },
        ],
      },
    }),
    Product.countDocuments({ stock: 0 }),
    getOrderStats(),
    getRecentOrders(5),
  ])

  return {
    products,
    activeProducts,
    categories,
    customers,
    lowStock,
    outOfStock,
    ...orderStats,
    recentOrders,
  }
}
