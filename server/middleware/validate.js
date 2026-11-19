import { validationResult } from 'express-validator'
import { ApiError } from '../utils/apiError.js'

const handleValidation = (statusCode, code) => (req, _res, next) => {
  const result = validationResult(req)
  if (result.isEmpty()) return next()

  const errors = result.array().map(({ path, msg }) => ({
    field: path,
    message: msg,
  }))

  next(new ApiError(statusCode, 'Validation failed.', code, errors))
}

export const validate = handleValidation(422, 'VALIDATION_ERROR')

// Payment verification follows the Razorpay contract: malformed fields are a
// client error (400), not a generic schema validation response.
export const validateBadRequest = handleValidation(400, 'INVALID_PAYMENT_DETAILS')
