import { Category } from '../models/Category.js'
import { Product } from '../models/Product.js'
import { ApiError } from '../utils/apiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { escapeRegex } from '../utils/slugify.js'
import { serializeCategory } from '../utils/serialize.js'

const writableFields = ['name', 'description', 'image', 'isActive', 'sortOrder']

const pickFields = (body) =>
  writableFields.reduce((result, field) => {
    if (body[field] !== undefined) result[field] = body[field]
    return result
  }, {})

export const listCategories = asyncHandler(async (req, res) => {
  const search = String(req.query.q || '').trim()
  const filter = { isActive: true }
  if (search) filter.name = { $regex: new RegExp(escapeRegex(search), 'i') }

  const categories = await Category.find(filter)
    .sort({ sortOrder: 1, name: 1 })
    .lean()

  res.json({ success: true, data: categories.map(serializeCategory) })
})

export const getCategory = asyncHandler(async (req, res) => {
  const category = await Category.findOne({
    slug: String(req.params.slug).toLowerCase(),
    isActive: true,
  }).lean()

  if (!category) throw new ApiError(404, 'Category not found.', 'NOT_FOUND')
  res.json({ success: true, data: serializeCategory(category) })
})

export const listAdminCategories = asyncHandler(async (_req, res) => {
  const categories = await Category.find().sort({ sortOrder: 1, name: 1 }).lean()
  res.json({ success: true, data: categories.map(serializeCategory) })
})

export const createCategory = asyncHandler(async (req, res) => {
  const fields = pickFields(req.body)
  if (await Category.exists({ name: fields.name })) {
    throw new ApiError(409, 'A category with this name already exists.', 'DUPLICATE_CATEGORY')
  }

  const category = await Category.create(fields)
  res.status(201).json({ success: true, data: serializeCategory(category) })
})

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id)
  if (!category) throw new ApiError(404, 'Category not found.', 'NOT_FOUND')

  Object.assign(category, pickFields(req.body))
  await category.save()

  res.json({ success: true, data: serializeCategory(category) })
})

export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id)
  if (!category) throw new ApiError(404, 'Category not found.', 'NOT_FOUND')

  const productCount = await Product.countDocuments({ category: category._id })
  if (productCount > 0) {
    throw new ApiError(
      409,
      'Reassign or delete products in this category before removing it.',
      'CATEGORY_IN_USE',
      { productCount },
    )
  }

  await category.deleteOne()
  res.json({ success: true, data: { message: 'Category deleted.' } })
})
