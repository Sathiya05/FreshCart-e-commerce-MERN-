import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import { pathToFileURL } from 'node:url'
import { connectDatabase } from './config/database.js'
import { env } from './config/env.js'
import { errorHandler } from './middleware/error.middleware.js'
import { notFound } from './middleware/notFound.middleware.js'
import routes from './routes/index.js'
const app = express()

const allowedOrigins = env.clientUrl
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

console.log('[CORS] Allowed origins:', allowedOrigins)

app.set('trust proxy', 1)

// Security and request-parsing middleware.
app.use(helmet())

app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      // Non-browser clients (curl, server-to-server) omit the Origin header.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true)
      }

      const error = new Error('Origin not allowed by CORS')
      error.statusCode = 403
      error.code = 'CORS_FORBIDDEN'
      return callback(error)
    },
  }),
)

app.use(
  express.json({
    limit: '1mb',
    // Keep a raw body for Razorpay webhook signature verification.
    verify: (req, _res, buffer) => {
      const requestPath = (req.originalUrl || req.url || '').split('?')[0]
      const signedWebhook =
        requestPath === '/api/payments/webhook' ||
        requestPath === '/payments/webhook'

      if (signedWebhook) req.rawBody = Buffer.from(buffer)
    },
  }),
)
app.use(express.urlencoded({ extended: true, limit: '1mb' }))
app.use(cookieParser())

const apiLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  limit: env.rateLimitMax,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please try again later.',
    },
  },
})

// Only credential-submitting endpoints should be limited. Session maintenance
// (/me, /refresh, /logout) and the public Google config are called on every
// page load; counting them here caused real users to hit the limit and see
// "try again later" during a perfectly normal Google sign-in.
const routineAuthPaths = new Set(['/me', '/google/config', '/refresh', '/logout'])

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: (req) => routineAuthPaths.has(req.path),
  // A successful sign-in should never eat into the next attempt's allowance.
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many sign-in attempts. Please wait a few minutes and try again.',
    },
  },
})

// AI chat makes paid provider calls, so it gets a stricter limit than catalog reads.
const aiLimiter = rateLimit({
  windowMs: env.aiRateLimitWindowMs,
  limit: env.aiRateLimitMax,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'AI_RATE_LIMITED',
      message: 'Too many assistant requests. Please try again later.',
    },
  },
})

app.use('/api', apiLimiter)
app.use('/api/auth', authLimiter)
app.use('/api/ai', aiLimiter)

// Vercel serverless functions do not run the listen/startup path below.
// Connect on demand so every /api request has a database before handlers run.
app.use('/api', async (_req, res, next) => {
  try {
    await connectDatabase()
    return next()
  } catch (error) {
    return next(error)
  }
})

app.use('/api', routes)

app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'FreshCart API is running.',
    healthEndpoint: '/api/health',
  })
})

app.use(notFound)
app.use(errorHandler)

const startServer = async () => {
  await connectDatabase()

  app.listen(env.port, () => {
    console.log(
      `[server] FreshCart API listening on http://localhost:${env.port} (${env.nodeEnv})`,
    )
  })
}

const isDirectRun =
  typeof process.argv[1] === 'string' &&
  import.meta.url === pathToFileURL(process.argv[1]).href

// Preserve local dev and Render startup; Vercel imports the app as a module.
if (isDirectRun && !process.env.VERCEL) {
  startServer().catch((error) => {
    console.error('[server] Failed to start:', error.message)
    process.exitCode = 1
  })
}

export { app }
export default app
