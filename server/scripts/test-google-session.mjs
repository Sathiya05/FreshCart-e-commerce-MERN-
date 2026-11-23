import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { connectDatabase } from '../config/database.js'
import { User } from '../models/User.js'
import { generateAccessToken, verifyAccessToken } from '../utils/tokens.js'

await connectDatabase()

const email = `google-session-${randomBytes(4).toString('hex')}@example.com`
const user = await User.create({
  name: 'Google Session Test',
  email,
  password: 'Test12345!',
  role: 'customer',
})

try {
  // A customer who signed out before has a non-zero tokenVersion. The Google
  // sign-in lookup must explicitly load this select:false field.
  await User.findByIdAndUpdate(user.id, { tokenVersion: 1 })
  const googlePathUser = await User.findOne({ email }).select('+tokenVersion')

  assert.equal(
    googlePathUser.tokenVersion,
    1,
    'Google sign-in must load tokenVersion before issuing a session',
  )

  const payload = verifyAccessToken(generateAccessToken(googlePathUser))
  assert.equal(payload.tokenVersion, 1, 'Google session token must match the database')

  console.log('Google session tokenVersion checks passed.')
} finally {
  await User.deleteOne({ email })
  process.exit(0)
}
