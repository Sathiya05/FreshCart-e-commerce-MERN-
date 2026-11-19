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

const razorpayKeyId = process.env.RAZORPAY_KEY_ID || ''
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || ''
const razorpayWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || ''
const razorpayConfigured = Boolean(razorpayKeyId && razorpayKeySecret)
const hasPartialRazorpayConfig = Boolean(
  razorpayKeyId || razorpayKeySecret || razorpayWebhookSecret,
)

if (isProduction && hasPartialRazorpayConfig && !razorpayWebhookSecret) {
  throw new Error(
    'RAZORPAY_WEBHOOK_SECRET must be set when Razorpay keys are configured in production.',
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
  razorpayKeyId,
  razorpayKeySecret,
  razorpayWebhookSecret,
  razorpayCurrency: process.env.RAZORPAY_CURRENCY || 'INR',
  razorpayConfigured,
  awsRegion: process.env.AWS_REGION || '',
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  s3Bucket: process.env.S3_BUCKET || '',
  s3PublicBaseUrl: (process.env.S3_PUBLIC_BASE_URL || '').replace(/\/+$/, ''),
  s3Configured: Boolean(
    process.env.AWS_REGION &&
      process.env.S3_BUCKET &&
      ((process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) ||
        process.env.AWS_USE_IAM_ROLE === 'true'),
  ),
  s3UseIamRole: process.env.AWS_USE_IAM_ROLE === 'true',
}
