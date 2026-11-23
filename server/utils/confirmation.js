import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import { env } from '../config/env.js'
import { UsedConfirmationToken } from '../models/UsedConfirmationToken.js'

const CONFIRMATION_TTL_MS = 5 * 60 * 1000
const SIGNING_CONTEXT = 'freshcart-cart-confirmation-v1'
const usedTokens = new Map()

const safeEqual = (left, right) => {
  const leftBuffer = Buffer.from(String(left))
  const rightBuffer = Buffer.from(String(right))
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  )
}

const purgeExpiredTokens = (now = Date.now()) => {
  for (const [token, expiresAt] of usedTokens) {
    if (expiresAt <= now) usedTokens.delete(token)
  }
}

const sign = (body) =>
  createHmac('sha256', env.jwtRefreshSecret)
    .update(`${SIGNING_CONTEXT}.${body}`)
    .digest('base64url')

/** Verify signature and expiry, then return the opaque token and its payload. */
const decodeSignedToken = (token) => {
  const value = String(token || '')
  const [body, signature] = value.split('.')
  if (!body || !signature) return null

  if (!safeEqual(signature, sign(body))) return null

  let payload
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
  } catch {
    return null
  }

  if (!payload || !payload.e || Number(payload.e) <= Date.now()) return null
  return { value, payload }
}

/** Opaque, stateless confirmation token bound to one customer and one cart change. */
export const createCartConfirmationToken = ({
  userId,
  action,
  productId = '',
  quantity = 0,
}) => {
  const payload = {
    u: String(userId),
    a: String(action),
    p: String(productId || ''),
    q: Number(quantity) || 0,
    e: Date.now() + CONFIRMATION_TTL_MS,
    i: randomUUID(),
  }
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')

  return `${body}.${sign(body)}`
}

export const verifyCartConfirmationToken = (
  token,
  { userId, action, productId = '', quantity = 0 },
) => {
  const decoded = decodeSignedToken(token)
  if (!decoded) return false

  purgeExpiredTokens()

  const { value, payload } = decoded
  if (String(payload.u) !== String(userId)) return false
  if (String(payload.a) !== String(action)) return false
  if (String(payload.p) !== String(productId || '')) return false
  if ((Number(payload.q) || 0) !== (Number(quantity) || 0)) return false
  if (usedTokens.has(value)) return false

  return payload
}

/**
 * Atomically mark a signed token as consumed. The unique MongoDB jti makes the
 * single-use guarantee hold across server instances; the in-process map is only
 * a fast local rejection path.
 */
export const consumeCartConfirmationToken = async (token) => {
  const decoded = decodeSignedToken(token)
  if (!decoded) return false

  const { value, payload } = decoded
  const jti = String(payload.i || createHash('sha256').update(value).digest('hex'))

  try {
    await UsedConfirmationToken.create({
      jti,
      expiresAt: new Date(Number(payload.e)),
    })
    usedTokens.set(value, Number(payload.e))
    purgeExpiredTokens()
    return true
  } catch (error) {
    if (error?.code === 11000) {
      // Another instance consumed it; cache that fact locally as well.
      usedTokens.set(value, Number(payload.e))
      purgeExpiredTokens()
      return false
    }
    console.error('[confirmation] Could not record consumed token:', error?.message || error)
    return false
  }
}
