import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
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
      console.log('[CORS] Incoming origin:', origin)
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
    // Razorpay signs the exact request body, so keep a copy for webhook checks.
    verify: (req, _res, buffer) => {
      if (req.path === '/payments/webhook' || req.originalUrl === '/api/payments/webhook') {
        req.rawBody = Buffer.from(buffer)
      }
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

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many authentication attempts. Please try again later.',
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

startServer().catch((error) => {
  console.error('[server] Failed to start:', error.message)
  process.exitCode = 1
})

export { app }
