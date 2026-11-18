import { env } from '../config/env.js'

export const errorHandler = (error, _req, res, _next) => {
  const statusCode = error.statusCode || 500
  const isProduction = env.nodeEnv === 'production'

  if (statusCode >= 500) {
    console.error('[error]', error)
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: error.code || 'SERVER_ERROR',
      message:
        statusCode >= 500 && isProduction
          ? 'Something went wrong. Please try again later.'
          : error.message,
      ...(!isProduction && error.stack ? { stack: error.stack } : {}),
    },
  })
}
