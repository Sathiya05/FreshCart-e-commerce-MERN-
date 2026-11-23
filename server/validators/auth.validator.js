import { body } from 'express-validator'

export const registerValidator = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage('Name must be between 2 and 80 characters'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Enter a valid email address')
    .normalizeEmail(),
  body('password')
    .isString()
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters'),
  body('phone').optional({ nullable: true }).trim().isLength({ max: 20 }),
]

export const loginValidator = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Enter a valid email address')
    .normalizeEmail(),
  body('password').isString().notEmpty().withMessage('Password is required'),
]

export const googleAuthValidator = [
  body('credential')
    .isString()
    .withMessage('Google credential must be text')
    .trim()
    .notEmpty()
    .withMessage('Google credential is required')
    .isLength({ max: 4096 })
    .withMessage('Google credential is too long'),
]

export const updateProfileValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage('Name must be between 2 and 80 characters'),
  body('phone').optional({ nullable: true }).trim().isLength({ max: 20 }),
  body('avatar').optional({ nullable: true }).trim(),
]
