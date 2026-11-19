import { body, param } from 'express-validator'
import { ORDER_STATUSES } from '../constants/order.js'

const idParam = param('id').isMongoId().withMessage('Invalid ID')

export const createOrderValidator = [
  body('addressId').isMongoId().withMessage('Select a valid delivery address'),
  body('paymentMethod')
    .isIn(['cod'])
    .withMessage('Only cash on delivery is available'),
  body('deliverySlot')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 120 })
    .withMessage('Delivery slot cannot exceed 120 characters'),
]

export const orderIdValidator = [idParam]

export const updateOrderStatusValidator = [
  idParam,
  body('status')
    .isIn(ORDER_STATUSES)
    .withMessage('Invalid order status'),
]
