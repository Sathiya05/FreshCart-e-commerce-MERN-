import { env } from '../config/env.js'

export const errorHandler = (error, _req, res, _next) => {
  let statusCode = error.statusCode || 500
  let code = error.code || 'SERVER_ERROR'
  let message = error.message || 'Something went wrong.'
  let details = error.details

  if (error.name === 'ValidationError') {
    statusCode = 422
    code = 'VALIDATION_ERROR'
    message = Object.values(error.errors || {})
      .map((item) => item.message)
      .join('; ')
  } else if (error.name === 'CastError') {
    statusCode = 400
    code = 'INVALID_ID'
    message = `Invalid value for ${error.path || 'id'}`
  } else if (error.code === 11000) {
    statusCode = 409
    code = 'DUPLICATE_VALUE'
    const field = Object.keys(error.keyPattern || error.keyValue || {})[0]
    message = field ? `${field} is already in use.` : 'This record already exists.'
  } else if (
    error.name === 'JsonWebTokenError' ||
    error.name === 'TokenExpiredError'
  ) {
    statusCode = 401
    code = 'INVALID_TOKEN'
    message = 'Your session is invalid or has expired.'
  }

  if (statusCode >= 500) {
    if (code.startsWith('AI_')) {
      console.warn(`[ai] ${code}: ${message}`)
    } else {
      console.error('[error]', error)
    }
    // AI messages are written for customers and contain no internal detail.
    if (env.isProduction && !code.startsWith('AI_')) {
      message = 'Something went wrong. Please try again later.'
    }
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
      ...(!env.isProduction && error.stack ? { stack: error.stack } : {}),
    },
  })
}
