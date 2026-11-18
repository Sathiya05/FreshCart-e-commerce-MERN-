import dotenv from 'dotenv'

dotenv.config()

const toPositiveNumber = (value, fallback) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: toPositiveNumber(process.env.PORT, 5000),
  clientUrl:
    process.env.CLIENT_URL || 'http://localhost:5173,http://localhost:4173',
  mongodbUri: process.env.MONGODB_URI || '',
  mongoDbName: process.env.MONGODB_DB_NAME || 'freshcart',
  rateLimitWindowMs: toPositiveNumber(
    process.env.RATE_LIMIT_WINDOW_MS,
    15 * 60 * 1000,
  ),
  rateLimitMax: toPositiveNumber(process.env.RATE_LIMIT_MAX, 100),
}
