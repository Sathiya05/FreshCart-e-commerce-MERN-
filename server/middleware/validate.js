import { validationResult } from 'express-validator'
import { ApiError } from '../utils/apiError.js'

export const validate = (req, _res, next) => {
  const result = validationResult(req)
  if (result.isEmpty()) return next()

  const errors = result.array().map(({ path, msg }) => ({
    field: path,
    message: msg,
  }))

  next(new ApiError(422, 'Validation failed.', 'VALIDATION_ERROR', errors))
}
