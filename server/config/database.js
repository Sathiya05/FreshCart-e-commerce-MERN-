import mongoose from 'mongoose'
import { env } from './env.js'

mongoose.set('strictQuery', true)

const connectionStates = [
  'disconnected',
  'connected',
  'connecting',
  'disconnecting',
]

// Cache the connection across Vercel serverless invocations / warm reloads.
const cached = globalThis.__freshcartMongoose || { conn: null, promise: null }
globalThis.__freshcartMongoose = cached

/**
 * The idempotency index changed from sparse to partial because legacy orders
 * store `idempotencyKey: null` (sparse indexes do not skip explicit nulls).
 * Replace a stale index definition in place; no order documents are modified.
 */
const ensureCriticalIndexes = async () => {
  try {
    const { Order } = await import('../models/Order.js')
    const existing = await Order.collection.indexes()
    const stale = existing.find(
      (index) =>
        index.name === 'user_1_idempotencyKey_1' &&
        !index.partialFilterExpression,
    )
    if (stale) await Order.collection.dropIndex(stale.name)
    await Order.init()
  } catch (error) {
    // Do not take the API down for an index migration. The in-process checkout
    // lock still prevents duplicate orders within one server instance.
    console.warn(`[db] Could not verify order indexes: ${error.message}`)
  }
}

export const getDatabaseState = () =>
  connectionStates[mongoose.connection.readyState] || 'unknown'

export const connectDatabase = async () => {
  if (!env.mongodbUri) {
    console.warn(
      '[db] MONGODB_URI is not set. The API will start without database connectivity. ' +
        'Copy server/.env.example to server/.env and add your MongoDB Atlas URI.',
    )
    return false
  }

  if (mongoose.connection.readyState === 1) {
    cached.conn = mongoose.connection
    return true
  }

  if (cached.promise) {
    return cached.promise
  }

  cached.promise = mongoose
    .connect(env.mongodbUri, {
      dbName: env.mongoDbName,
      serverSelectionTimeoutMS: 10000,
    })
    .then(async () => {
      cached.conn = mongoose.connection
      console.log(`[db] MongoDB connected to database "${env.mongoDbName}".`)
      await ensureCriticalIndexes()
      return true
    })
    .catch((error) => {
      cached.promise = null
      console.error(`[db] MongoDB connection failed: ${error.message}`)

      if (env.nodeEnv === 'production') {
        throw error
      }

      console.warn(
        '[db] Continuing in development mode without a database. ' +
          'Check the URI, database user password, and Atlas IP allowlist.',
      )
      return false
    })

  return cached.promise
}

mongoose.connection.on('error', (error) => {
  console.error(`[db] Runtime MongoDB error: ${error.message}`)
})
