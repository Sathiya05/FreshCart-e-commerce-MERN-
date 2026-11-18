import dotenv from 'dotenv'

dotenv.config()

const toPositiveNumber = (value, fallback) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const nodeEnv = process.env.NODE_ENV || 'development'
const isProduction = nodeEnv === 'production'

const jwtSecret =
  process.env.JWT_SECRET ||
  (isProduction ? '' : 'freshcart-local-development-access-secret')
const jwtRefreshSecret =
  process.env.JWT_REFRESH_SECRET ||
  (isProduction ? '' : 'freshcart-local-development-refresh-secret')

if (isProduction && (!jwtSecret || !jwtRefreshSecret)) {
  throw new Error(
    'JWT_SECRET and JWT_REFRESH_SECRET must be set in production. See server/.env.example.',
  )
}

export const env = {
  nodeEnv,
  isProduction,
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
  bcryptRounds: toPositiveNumber(process.env.BCRYPT_ROUNDS, 12),
  jwtSecret,
  jwtRefreshSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  accessCookieName: process.env.ACCESS_COOKIE_NAME || 'freshcart_access',
  refreshCookieName: process.env.REFRESH_COOKIE_NAME || 'freshcart_refresh',
  cookieSecure:
    process.env.COOKIE_SECURE === 'true' ||
    (isProduction && process.env.COOKIE_SECURE !== 'false'),
  cookieSameSite: process.env.COOKIE_SAME_SITE || (isProduction ? 'none' : 'lax'),
  cookieDomain: process.env.COOKIE_DOMAIN || undefined,
}
