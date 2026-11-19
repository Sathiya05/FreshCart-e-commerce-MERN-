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

export const verifyPaymentValidator = [
  body('orderId').isMongoId().withMessage('Invalid order ID'),
  body('razorpay_order_id').isString().notEmpty().withMessage('Missing payment order ID'),
  body('razorpay_payment_id').isString().notEmpty().withMessage('Missing payment ID'),
  body('razorpay_signature').isString().notEmpty().withMessage('Missing payment signature'),
]

export const orderIdValidator = [idParam]

export const updateOrderStatusValidator = [
  idParam,
  body('status')
    .isIn(ORDER_STATUSES)
    .withMessage('Invalid order status'),
]
