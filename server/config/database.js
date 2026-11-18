import mongoose from 'mongoose'
import { env } from './env.js'

mongoose.set('strictQuery', true)

const connectionStates = [
  'disconnected',
  'connected',
  'connecting',
  'disconnecting',
]

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

  try {
    await mongoose.connect(env.mongodbUri, {
      dbName: env.mongoDbName,
      serverSelectionTimeoutMS: 10000,
    })

    console.log(`[db] MongoDB connected to database "${env.mongoDbName}".`)
    return true
  } catch (error) {
    console.error(`[db] MongoDB connection failed: ${error.message}`)

    if (env.nodeEnv === 'production') {
      throw error
    }

    console.warn(
      '[db] Continuing in development mode without a database. ' +
        'Check the URI, database user password, and Atlas IP allowlist.',
    )
    return false
  }
}

mongoose.connection.on('error', (error) => {
  console.error(`[db] Runtime MongoDB error: ${error.message}`)
})
