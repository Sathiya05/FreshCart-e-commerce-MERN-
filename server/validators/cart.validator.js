import { body, param } from 'express-validator'

const idParam = param('id').isMongoId().withMessage('Invalid ID')

const quantityRule = body('quantity')
  .exists({ values: 'undefined' })
  .withMessage('Quantity is required')
  .bail()
  .isInt({ min: 1 })
  .withMessage('Quantity must be at least 1')
  .toInt()

export const addCartItemValidator = [
  body('productId').isMongoId().withMessage('Product must be a valid ID'),
  quantityRule,
]

export const updateCartItemValidator = [idParam, quantityRule]

export const cartItemIdValidator = [idParam]
