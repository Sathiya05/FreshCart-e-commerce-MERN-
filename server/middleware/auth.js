import { env } from '../config/env.js'
import { User } from '../models/User.js'
import { ApiError } from '../utils/apiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { verifyAccessToken } from '../utils/tokens.js'

const extractAccessToken = (req) => {
  const authorization = req.headers.authorization
  if (authorization && authorization.startsWith('Bearer ')) {
    return authorization.slice(7).trim()
  }
  return req.cookies?.[env.accessCookieName]
}

export const protect = asyncHandler(async (req, _res, next) => {
  const token = extractAccessToken(req)
  if (!token) {
    return next(
      new ApiError(401, 'Authentication required.', 'UNAUTHENTICATED'),
    )
  }

  let payload
  try {
    payload = verifyAccessToken(token)
  } catch {
    return next(
      new ApiError(401, 'Your session is invalid or has expired.', 'INVALID_TOKEN'),
    )
  }

  const user = await User.findById(payload.sub).select('+tokenVersion')
  if (!user || !user.isActive || payload.tokenVersion !== user.tokenVersion) {
    return next(
      new ApiError(401, 'Your session is no longer valid.', 'INVALID_TOKEN'),
    )
  }

  req.user = user
  next()
})

/**
 * Attaches req.user when a valid token is present, otherwise continues as a
 * guest. Used by public endpoints that offer extra capabilities to signed-in
 * customers (for example, the AI assistant's cart tools).
 */
export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = extractAccessToken(req)
  req.user = null

  if (!token) return next()

  try {
    const payload = verifyAccessToken(token)
    const user = await User.findById(payload.sub).select('+tokenVersion')

    if (user && user.isActive && payload.tokenVersion === user.tokenVersion) {
      req.user = user
    }
  } catch {
    // Invalid or expired tokens are treated as guest access on public routes.
  }

  next()
})

export const authorize = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(
      new ApiError(403, 'You do not have permission to do that.', 'FORBIDDEN'),
    )
  }
  next()
}
