import { body, param } from 'express-validator'

const idParam = param('id').isMongoId().withMessage('Invalid ID')

const couponFields = [
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Coupon code is required')
    .isLength({ max: 40 })
    .withMessage('Coupon code cannot exceed 40 characters'),
  body('discountType')
    .isIn(['percent', 'fixed'])
    .withMessage('Discount type must be percent or fixed'),
  body('discountValue')
    .isFloat({ min: 0 })
    .withMessage('Discount value must be zero or more')
    .toFloat(),
  body('minimumOrderAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum order cannot be negative')
    .toFloat(),
  body('maximumDiscount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum discount cannot be negative')
    .toFloat(),
  body('expiryDate')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Expiry date must be YYYY-MM-DD'),
  body('usageLimit')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Usage limit cannot be negative')
    .toInt(),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
]

export const couponIdValidator = [idParam]
export const createCouponValidator = couponFields
export const updateCouponValidator = [idParam, ...couponFields]
export const setCouponStatusValidator = [
  idParam,
  body('isActive').isBoolean().withMessage('isActive must be a boolean'),
]

export const customerIdValidator = [idParam]
export const setCustomerStatusValidator = [
  idParam,
  body('isActive').isBoolean().withMessage('isActive must be a boolean'),
]

export const reviewIdValidator = [idParam]
export const setReviewStatusValidator = [
  idParam,
  body('status')
    .isIn(['pending', 'approved', 'rejected'])
    .withMessage('Invalid review status'),
]

export const updateSettingsValidator = [
  body('storeName').optional().trim().notEmpty().isLength({ max: 100 }),
  body('supportEmail').optional().isEmail(),
  body('supportPhone').optional().trim().isLength({ max: 20 }),
  body('currency').optional().trim().isLength({ min: 3, max: 10 }),
  body('freeDeliveryAbove').optional().isFloat({ min: 0 }).toFloat(),
  body('defaultDeliveryFee').optional().isFloat({ min: 0 }).toFloat(),
  body('lowStockThreshold').optional().isInt({ min: 1 }).toInt(),
  body('orderNotifications').optional().isBoolean(),
  body('lowStockAlerts').optional().isBoolean(),
  body('weeklySummary').optional().isBoolean(),
]
