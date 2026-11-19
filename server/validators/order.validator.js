import { body, param } from 'express-validator'
import { ORDER_STATUSES } from '../constants/order.js'

const idParam = param('id').isMongoId().withMessage('Invalid ID')

const addressAndSlot = [
  body('addressId').isMongoId().withMessage('Select a valid delivery address'),
  body('deliverySlot')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 120 })
    .withMessage('Delivery slot cannot exceed 120 characters'),
]

export const createOrderValidator = [
  ...addressAndSlot,
  body('paymentMethod')
    .isIn(['cod'])
    .withMessage('Only cash on delivery is available on this endpoint'),
]

export const createPaymentOrderValidator = [
  ...addressAndSlot,
  body('paymentMethod')
    .isIn(['razorpay'])
    .withMessage('This endpoint creates online payment orders'),
]

const razorpayResponseFields = [
  body('razorpay_order_id').isString().notEmpty().withMessage('Missing payment order ID'),
  body('razorpay_payment_id').isString().notEmpty().withMessage('Missing payment ID'),
  body('razorpay_signature').isString().notEmpty().withMessage('Missing payment signature'),
]

export const verifyPaymentValidator = [
  body('orderId').isMongoId().withMessage('Invalid order ID'),
  ...razorpayResponseFields,
]

// The requested /api/create-order path accepts either the full FreshCart
// checkout payload or a direct Razorpay order request.
export const createAliasPaymentOrderValidator = [
  body('addressId')
    .if(body('amount').not().exists())
    .isMongoId()
    .withMessage('Select a valid delivery address'),
  body('paymentMethod')
    .if(body('amount').not().exists())
    .isIn(['razorpay'])
    .withMessage('This endpoint creates online payment orders'),
  body('deliverySlot')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 120 })
    .withMessage('Delivery slot cannot exceed 120 characters'),
  body('amount')
    .if(body('addressId').not().exists())
    .isInt({ min: 100 })
    .toInt()
    .withMessage('Amount must be at least 100 paise'),
  body('currency')
    .if(body('addressId').not().exists())
    .trim()
    .customSanitizer((value) => String(value).toUpperCase())
    .isLength({ min: 3, max: 10 })
    .withMessage('Currency is required'),
  body('receipt')
    .if(body('addressId').not().exists())
    .trim()
    .notEmpty()
    .isLength({ max: 40 })
    .withMessage('Receipt is required'),
]

export const verifyAliasPaymentValidator = [
  body('orderId').optional({ nullable: true }).isMongoId().withMessage('Invalid order ID'),
  ...razorpayResponseFields,
]

export const orderIdValidator = [idParam]

export const updateOrderStatusValidator = [
  idParam,
  body('status')
    .isIn(ORDER_STATUSES)
    .withMessage('Invalid order status'),
]
