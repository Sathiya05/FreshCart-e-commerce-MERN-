import { body, param, query } from 'express-validator'
import {
  ORDER_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
} from '../constants/order.js'
import { findDeliverySlot, isDeliveryDateAllowed } from '../constants/delivery.js'

const idParam = param('id').isMongoId().withMessage('Invalid ID')

const hasAddress = body('addressId').exists()

const deliveryFields = [
  body('deliveryDate')
    .if(hasAddress)
    .isString()
    .withMessage('Delivery date must be text')
    .trim()
    .custom((value) => isDeliveryDateAllowed(value))
    .withMessage('Choose an available delivery date'),
  body('deliverySlot')
    .if(hasAddress)
    .isString()
    .withMessage('Delivery slot must be text')
    .trim()
    .notEmpty()
    .withMessage('Select a delivery slot')
    .custom((value, { req }) =>
      Boolean(findDeliverySlot(req.body?.deliveryDate, value)),
    )
    .withMessage('Select an available delivery slot'),
  body('deliveryInstructions')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 200 })
    .withMessage('Delivery instructions cannot exceed 200 characters'),
  body('addressConfirmed')
    .if(hasAddress)
    .isBoolean()
    .withMessage('Confirm your delivery address')
    .custom((value) => value === true)
    .withMessage('Confirm your delivery address before placing the order'),
]

const idempotencyField = body('idempotencyKey')
  .optional({ nullable: true })
  .isString()
  .withMessage('Invalid idempotency key')
  .isLength({ max: 100 })
  .withMessage('Invalid idempotency key')

export const createOrderValidator = [
  body('addressId').isMongoId().withMessage('Select a valid delivery address'),
  ...deliveryFields,
  body('paymentMethod')
    .isIn(['cod'])
    .withMessage('Only cash on delivery is available on this endpoint'),
  idempotencyField,
]

export const createPaymentOrderValidator = [
  body('addressId').isMongoId().withMessage('Select a valid delivery address'),
  ...deliveryFields,
  body('paymentMethod')
    .isIn(['razorpay'])
    .withMessage('This endpoint creates online payment orders'),
  idempotencyField,
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
  ...deliveryFields,
  body('paymentMethod')
    .if(body('amount').not().exists())
    .isIn(['razorpay'])
    .withMessage('This endpoint creates online payment orders'),
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
  idempotencyField,
]

export const verifyAliasPaymentValidator = [
  body('orderId').optional({ nullable: true }).isMongoId().withMessage('Invalid order ID'),
  ...razorpayResponseFields,
]

export const orderIdValidator = [idParam]

export const listOrdersValidator = [
  query('page').optional().isInt({ min: 1, max: 100000 }),
  query('limit').optional().isInt({ min: 1, max: 60 }),
  query('status')
    .optional()
    .custom((value) => {
      const requested = String(value).split(',')
      return (
        requested.length > 0 && requested.every((status) => ORDER_STATUSES.includes(status))
      )
    })
    .withMessage('Invalid order status'),
  query('paymentStatus').optional().isIn(PAYMENT_STATUSES),
  query('paymentMethod').optional().isIn(PAYMENT_METHODS),
  query('sort').optional().isIn(['newest', 'oldest', 'total']),
  query('q').optional().isString().isLength({ max: 120 }),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
]

export const refundOrderValidator = [
  idParam,
  body('note')
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 300 })
    .withMessage('Note cannot exceed 300 characters'),
]

export const updateOrderStatusValidator = [
  idParam,
  body('status')
    .isIn(ORDER_STATUSES)
    .withMessage('Invalid order status'),
  body('note')
    .optional({ nullable: true })
    .isString()
    .withMessage('Note must be text')
    .isLength({ max: 300 })
    .withMessage('Note cannot exceed 300 characters'),
]
