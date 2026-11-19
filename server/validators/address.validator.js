import { body, param } from 'express-validator'

const idParam = param('id').isMongoId().withMessage('Invalid ID')

const requiredText = (field, message) =>
  body(field)
    .exists({ values: 'undefined' })
    .withMessage(message)
    .bail()
    .trim()
    .notEmpty()
    .withMessage(message)

const addressRules = () => [
  requiredText('fullName', 'Full name is required'),
  requiredText('phone', 'Phone number is required'),
  requiredText('addressLine', 'Address line is required'),
  requiredText('city', 'City is required'),
  requiredText('state', 'State is required'),
  requiredText('pincode', 'Pincode is required'),
  body('label')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 40 })
    .withMessage('Address label cannot exceed 40 characters'),
  body('addressType')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 40 })
    .withMessage('Address label cannot exceed 40 characters'),
  body('isDefault').optional().isBoolean().toBoolean(),
]

export const createAddressValidator = addressRules()
export const updateAddressValidator = [idParam, ...addressRules()]
export const addressIdValidator = [idParam]
