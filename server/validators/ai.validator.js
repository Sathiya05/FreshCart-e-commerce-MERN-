import { body } from 'express-validator'
import { AI_LIMITS } from '../constants/ai.js'

export const aiChatValidator = [
  body('message')
    .isString()
    .withMessage('Message must be text')
    .trim()
    .isLength({ min: 1, max: AI_LIMITS.MESSAGE_MAX })
    .withMessage(`Message must be between 1 and ${AI_LIMITS.MESSAGE_MAX} characters`),
  body('history')
    .optional({ nullable: true })
    .isArray({ max: AI_LIMITS.HISTORY_MAX })
    .withMessage(`History cannot contain more than ${AI_LIMITS.HISTORY_MAX} messages`),
  body('history.*.role')
    .optional()
    .isIn(['user', 'assistant'])
    .withMessage('Invalid message role'),
  body('history.*.content')
    .optional()
    .isString()
    .withMessage('History content must be text')
    .trim()
    .isLength({ min: 1, max: AI_LIMITS.HISTORY_CONTENT_MAX })
    .withMessage('History messages are too long'),
  body('confirmation')
    .optional({ nullable: true })
    .isObject()
    .withMessage('Invalid confirmation'),
  body('confirmation.token')
    .optional()
    .isString()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Invalid confirmation token'),
  body('confirmation.action')
    .optional()
    .isIn(['add', 'update', 'remove', 'clear'])
    .withMessage('Invalid confirmation action'),
  body('confirmation.productId')
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 100 })
    .withMessage('Invalid confirmation product'),
  body('confirmation.quantity')
    .optional({ nullable: true })
    .isInt({ min: 0, max: 20 })
    .withMessage('Invalid confirmation quantity'),
  body('confirmation.confirmed')
    .optional()
    .isBoolean()
    .withMessage('Invalid confirmation approval'),
]
