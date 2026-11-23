import { randomBytes } from 'node:crypto'
import { OAuth2Client } from 'google-auth-library'
import { env } from '../config/env.js'
import { User } from '../models/User.js'
import { ApiError } from '../utils/apiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { clearAuthCookies, setAuthCookies } from '../utils/cookies.js'
import { serializeUser } from '../utils/serialize.js'
import {
  generateAccessToken,
  generateAuthTokens,
  verifyRefreshToken,
} from '../utils/tokens.js'

const authPayload = (user) => ({
  user: serializeUser(user),
  accessToken: generateAccessToken(user),
})

const googleClient = env.googleClientId ? new OAuth2Client(env.googleClientId) : null

const googleDisplayName = (payload, email) => {
  const candidate = String(payload?.name || '').trim()
  if (candidate.length >= 2) return candidate.slice(0, 80)

  const emailName = email.split('@')[0].trim()
  return emailName.length >= 2 ? emailName.slice(0, 80) : 'FreshCart User'
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body
  const normalizedEmail = String(email).toLowerCase()

  if (await User.exists({ email: normalizedEmail })) {
    throw new ApiError(409, 'An account with this email already exists.', 'EMAIL_IN_USE')
  }

  const user = await User.create({
    name,
    email: normalizedEmail,
    password,
    phone,
    role: 'customer',
  })

  setAuthCookies(res, generateAuthTokens(user))
  res.status(201).json({ success: true, data: authPayload(user) })
})

export const login = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: String(req.body.email).toLowerCase() })
    .select('+password +tokenVersion')

  if (!user || !(await user.comparePassword(req.body.password))) {
    throw new ApiError(401, 'Invalid email or password.', 'INVALID_CREDENTIALS')
  }

  if (!user.isActive) {
    throw new ApiError(403, 'This account has been deactivated.', 'ACCOUNT_INACTIVE')
  }

  setAuthCookies(res, generateAuthTokens(user))
  res.json({ success: true, data: authPayload(user) })
})

/** Non-secret configuration for the login page. The OAuth client ID is public. */
export const getGoogleAuthConfig = asyncHandler(async (_req, res) => {
  res.json({
    success: true,
    data: {
      enabled: Boolean(googleClient),
      clientId: googleClient ? env.googleClientId : '',
    },
  })
})

/**
 * Verifies Google's ID token on the server. Only a verified email is trusted;
 * the browser never supplies a name, role, user ID or token secret.
 */
export const googleSignIn = asyncHandler(async (req, res) => {
  if (!googleClient) {
    throw new ApiError(
      503,
      'Google sign-in is not configured on this server.',
      'GOOGLE_AUTH_DISABLED',
    )
  }

  let payload
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: req.body.credential,
      audience: env.googleClientId,
    })
    payload = ticket.getPayload()
  } catch {
    throw new ApiError(401, 'Google sign-in failed or expired. Please try again.', 'GOOGLE_TOKEN_INVALID')
  }

  const email = String(payload?.email || '').toLowerCase().trim()
  if (!email || payload?.email_verified !== true) {
    throw new ApiError(403, 'A verified Google email is required.', 'GOOGLE_EMAIL_UNVERIFIED')
  }

  let user = await User.findOne({ email })

  if (user && !user.isActive) {
    throw new ApiError(403, 'This account has been deactivated.', 'ACCOUNT_INACTIVE')
  }

  if (!user) {
    user = await User.create({
      name: googleDisplayName(payload, email),
      email,
      // Google users never need this password. It is random and bcrypt-hashed.
      password: randomBytes(32).toString('hex'),
      avatar: String(payload.picture || '').slice(0, 500),
      role: 'customer',
      isActive: true,
    })
  }

  setAuthCookies(res, generateAuthTokens(user))
  res.json({ success: true, data: authPayload(user) })
})

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[env.refreshCookieName] || req.body?.refreshToken
  if (!token) {
    throw new ApiError(401, 'Refresh token is missing.', 'NO_REFRESH_TOKEN')
  }

  let payload
  try {
    payload = verifyRefreshToken(token)
  } catch {
    throw new ApiError(401, 'Your refresh token is invalid or expired.', 'INVALID_REFRESH_TOKEN')
  }

  const user = await User.findById(payload.sub).select('+tokenVersion')
  if (!user || !user.isActive || payload.tokenVersion !== user.tokenVersion) {
    throw new ApiError(401, 'Your session is no longer valid.', 'INVALID_REFRESH_TOKEN')
  }

  setAuthCookies(res, generateAuthTokens(user))
  res.json({ success: true, data: authPayload(user) })
})

export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[env.refreshCookieName]
  if (token) {
    try {
      const payload = verifyRefreshToken(token)
      const user = await User.findById(payload.sub).select('+tokenVersion')
      if (user && payload.tokenVersion === user.tokenVersion) {
        user.tokenVersion += 1
        await user.save()
      }
    } catch {
      // A stale or forged refresh token still results in a clean client logout.
    }
  }

  clearAuthCookies(res)
  res.json({ success: true, data: { message: 'Signed out.' } })
})

export const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: serializeUser(req.user) })
})

export const updateMe = asyncHandler(async (req, res) => {
  const updates = {}
  for (const field of ['name', 'phone', 'avatar']) {
    if (req.body[field] !== undefined) updates[field] = req.body[field]
  }

  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true,
  })

  res.json({ success: true, data: serializeUser(user) })
})
