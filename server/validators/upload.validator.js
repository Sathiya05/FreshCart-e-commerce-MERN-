import { body } from 'express-validator'

export const createUploadTicketValidator = [
  body('fileName')
    .isString()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('A file name is required'),
  body('contentType')
    .isIn(['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
    .withMessage('Use a JPG, PNG, WebP or AVIF image'),
  body('size')
    .isInt({ min: 1, max: 5 * 1024 * 1024 })
    .withMessage('Images must be 5 MB or smaller'),
]
