import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import mongoose from 'mongoose'
import { connectDatabase } from '../config/database.js'
import { env } from '../config/env.js'
import { UsedConfirmationToken } from '../models/UsedConfirmationToken.js'
import {
  consumeCartConfirmationToken,
  createCartConfirmationToken,
  verifyCartConfirmationToken,
} from '../utils/confirmation.js'

const userId = `user-${randomBytes(4).toString('hex')}`
const originalSecret = env.jwtRefreshSecret
env.jwtRefreshSecret = 'test-confirmation-secret'

let jti = ''
try {
  await connectDatabase()

  const token = createCartConfirmationToken({
    userId,
    action: 'update',
    productId: '507f1f77bcf86cd799439011',
    quantity: 3,
  })
  jti = JSON.parse(Buffer.from(token.split('.')[0], 'base64url').toString('utf8')).i

  assert.ok(token.split('.').length === 2)
  assert.ok(jti)
  assert.ok(
    verifyCartConfirmationToken(token, {
      userId,
      action: 'update',
      productId: '507f1f77bcf86cd799439011',
      quantity: 3,
    }),
  )
  assert.equal(
    verifyCartConfirmationToken(token, {
      userId,
      action: 'update',
      productId: '507f1f77bcf86cd799439011',
      quantity: 4,
    }),
    false,
  )
  assert.equal(
    verifyCartConfirmationToken(token, {
      userId: 'another-user',
      action: 'update',
      productId: '507f1f77bcf86cd799439011',
      quantity: 3,
    }),
    false,
  )

  assert.equal(await consumeCartConfirmationToken(token), true)
  assert.equal(await consumeCartConfirmationToken(token), false)
  assert.equal(
    verifyCartConfirmationToken(token, {
      userId,
      action: 'update',
      productId: '507f1f77bcf86cd799439011',
      quantity: 3,
    }),
    false,
  )

  console.log('AI cart confirmation token checks passed.')
} finally {
  if (jti) await UsedConfirmationToken.deleteOne({ jti })
  await mongoose.disconnect()
  env.jwtRefreshSecret = originalSecret
}
