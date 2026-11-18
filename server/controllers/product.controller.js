import { Category } from '../models/Category.js'
import { Product } from '../models/Product.js'
import { ApiError } from '../utils/apiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { serializeProduct } from '../utils/serialize.js'
import {
  findProductByIdentifier,
  listProducts as queryProducts,
} from '../services/catalog.service.js'

const writableFields = [
  'name',
  'description',
  'shortDescription',
  'category',
  'brand',
  'sku',
  'price',
  'discountPrice',
  'stock',
  'lowStockThreshold',
  'unit',
  'images',
  'rating',
  'reviewCount',
  'tags',
  'isActive',
  'featured',
  'bestSeller',
  'dailyDeal',
]

const pickFields = (body) =>
  writableFields.reduce((result, field) => {
    if (body[field] !== undefined) result[field] = body[field]
    return result
  }, {})

const assertActiveCategory = async (categoryId) => {
  const exists = await Category.exists({ _id: categoryId, isActive: true })
  if (!exists) {
    throw new ApiError(400, 'Category does not exist or is inactive.', 'INVALID_CATEGORY')
  }
}

export const listProducts = asyncHandler(async (req, res) => {
  const data = await queryProducts(req.query)
  res.json({ success: true, data })
})

export const getProduct = asyncHandler(async (req, res) => {
  const product = await findProductByIdentifier(req.params.id)
  if (!product) throw new ApiError(404, 'Product not found.', 'NOT_FOUND')
  res.json({ success: true, data: serializeProduct(product) })
})

export const listAdminProducts = asyncHandler(async (req, res) => {
  const data = await queryProducts(req.query, { allowInactive: true })
  res.json({ success: true, data })
})

export const getAdminProduct = asyncHandler(async (req, res) => {
  const product = await findProductByIdentifier(req.params.id, { allowInactive: true })
  if (!product) throw new ApiError(404, 'Product not found.', 'NOT_FOUND')
  res.json({ success: true, data: serializeProduct(product) })
})

export const createProduct = asyncHandler(async (req, res) => {
  const fields = pickFields(req.body)
  await assertActiveCategory(fields.category)

  const product = await Product.create(fields)
  await product.populate('category', 'name slug isActive')

  res.status(201).json({ success: true, data: serializeProduct(product) })
})

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
  if (!product) throw new ApiError(404, 'Product not found.', 'NOT_FOUND')

  const fields = pickFields(req.body)
  if (fields.category) await assertActiveCategory(fields.category)
  if (fields.discountPrice === null || fields.discountPrice === '') {
    fields.discountPrice = undefined
  }

  for (const [field, value] of Object.entries(fields)) {
    product.set(field, value)
  }

  await product.save()
  await product.populate('category', 'name slug isActive')

  res.json({ success: true, data: serializeProduct(product) })
})

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id)
  if (!product) throw new ApiError(404, 'Product not found.', 'NOT_FOUND')

  res.json({ success: true, data: { message: 'Product deleted.' } })
})
