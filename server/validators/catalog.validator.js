import { body, param } from 'express-validator'

const idParam = param('id').isMongoId().withMessage('Invalid ID')

const requiredText = (field, min, max, message) =>
  body(field)
    .exists({ values: 'undefined' })
    .withMessage(message)
    .bail()
    .trim()
    .isLength({ min, max })
    .withMessage(message)

const optionalText = (field, max, message) =>
  body(field)
    .optional({ nullable: true })
    .trim()
    .isLength({ max })
    .withMessage(message)

export const createCategoryValidator = [
  requiredText('name', 2, 80, 'Category name must be between 2 and 80 characters'),
  optionalText('description', 500, 'Description cannot exceed 500 characters'),
  optionalText('image', 2000, 'Image URL is too long'),
  body('isActive').optional().isBoolean().toBoolean(),
  body('sortOrder').optional().isInt().toInt(),
]

export const updateCategoryValidator = [
  idParam,
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage('Category name must be between 2 and 80 characters'),
  optionalText('description', 500, 'Description cannot exceed 500 characters'),
  optionalText('image', 2000, 'Image URL is too long'),
  body('isActive').optional().isBoolean().toBoolean(),
  body('sortOrder').optional().isInt().toInt(),
]

export const categoryIdValidator = [idParam]

const sharedProductValidators = (required) => {
  const rules = []

  if (required) {
    rules.push(
      requiredText('name', 2, 120, 'Name must be between 2 and 120 characters'),
      body('category').isMongoId().withMessage('Category must be a valid ID'),
      body('price')
        .isFloat({ min: 0 })
        .withMessage('Price must be a positive number')
        .toFloat(),
      body('images')
        .isArray({ min: 1 })
        .withMessage('At least one product image is required'),
    )
  } else {
    rules.push(
      body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 120 })
        .withMessage('Name must be between 2 and 120 characters'),
      body('category').optional().isMongoId().withMessage('Category must be a valid ID'),
      body('price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Price must be a positive number')
        .toFloat(),
      body('images')
        .optional({ nullable: true })
        .isArray({ min: 1 })
        .withMessage('At least one product image is required'),
    )
  }

  rules.push(
    optionalText('description', 3000, 'Description cannot exceed 3000 characters'),
    optionalText('shortDescription', 200, 'Short description cannot exceed 200 characters'),
    optionalText('brand', 80, 'Brand cannot exceed 80 characters'),
    body('sku').optional({ nullable: true }).trim().toUpperCase().isLength({ max: 40 }),
    body('discountPrice')
      .optional({ nullable: true, checkFalsy: true })
      .isFloat({ min: 0 })
      .withMessage('Discount price must be a positive number')
      .toFloat(),
    body('stock')
      .optional({ nullable: true })
      .isFloat({ min: 0 })
      .withMessage('Stock cannot be negative')
      .toFloat(),
    body('lowStockThreshold')
      .optional({ nullable: true })
      .isFloat({ min: 0 })
      .withMessage('Low stock threshold cannot be negative')
      .toFloat(),
    optionalText('unit', 30, 'Unit cannot exceed 30 characters'),
    body('images.*').optional().trim().notEmpty().withMessage('Image URL cannot be empty'),
    body('rating')
      .optional({ nullable: true })
      .isFloat({ min: 0, max: 5 })
      .withMessage('Rating must be between 0 and 5')
      .toFloat(),
    body('reviewCount')
      .optional({ nullable: true })
      .isFloat({ min: 0 })
      .withMessage('Review count cannot be negative')
      .toFloat(),
    body('tags').optional({ nullable: true }).isArray(),
    body('tags.*').optional().trim().notEmpty(),
    body('isActive').optional().isBoolean().toBoolean(),
    body('featured').optional().isBoolean().toBoolean(),
    body('bestSeller').optional().isBoolean().toBoolean(),
    body('dailyDeal').optional().isBoolean().toBoolean(),
  )

  return rules
}

export const createProductValidator = sharedProductValidators(true)
export const updateProductValidator = [idParam, ...sharedProductValidators(false)]
export const productIdValidator = [idParam]
