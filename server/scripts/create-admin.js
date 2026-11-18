import mongoose from 'mongoose'
import { connectDatabase, getDatabaseState } from '../config/database.js'
import { User } from '../models/User.js'

const required = ['ADMIN_NAME', 'ADMIN_EMAIL', 'ADMIN_PASSWORD']
const missing = required.filter((key) => !process.env[key])

if (missing.length) {
  console.error(
    `[admin] Missing required environment variables: ${missing.join(', ')}. ` +
      'Add them to server/.env before running this script.',
  )
  process.exitCode = 1
} else {
  await connectDatabase()

  if (getDatabaseState() !== 'connected') {
    console.error('[admin] MongoDB is not connected. Check MONGODB_URI and try again.')
    process.exitCode = 1
  } else {
    const email = process.env.ADMIN_EMAIL.trim().toLowerCase()
    const existing = await User.findOne({ email }).select('+password')

    if (existing) {
      existing.name = process.env.ADMIN_NAME.trim()
      existing.password = process.env.ADMIN_PASSWORD
      existing.role = 'admin'
      existing.isActive = true
      await existing.save()
      console.log(`[admin] Updated existing account ${email} to admin role.`)
    } else {
      await User.create({
        name: process.env.ADMIN_NAME.trim(),
        email,
        password: process.env.ADMIN_PASSWORD,
        role: 'admin',
      })
      console.log(`[admin] Created admin account ${email}.`)
    }

    await mongoose.connection.close()
  }
}
