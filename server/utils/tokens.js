import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

const basePayload = (user) => ({
  sub: String(user._id || user.id),
  role: user.role,
  tokenVersion: user.tokenVersion || 0,
})

export const generateAccessToken = (user) =>
  jwt.sign(
    { ...basePayload(user), type: 'access' },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  )

export const generateRefreshToken = (user) =>
  jwt.sign(
    { ...basePayload(user), type: 'refresh' },
    env.jwtRefreshSecret,
    { expiresIn: env.jwtRefreshExpiresIn },
  )

export const generateAuthTokens = (user) => ({
  accessToken: generateAccessToken(user),
  refreshToken: generateRefreshToken(user),
})

export const verifyAccessToken = (token) => {
  const payload = jwt.verify(token, env.jwtSecret)
  if (payload.type !== 'access') throw new Error('Invalid access token type')
  return payload
}

export const verifyRefreshToken = (token) => {
  const payload = jwt.verify(token, env.jwtRefreshSecret)
  if (payload.type !== 'refresh') throw new Error('Invalid refresh token type')
  return payload
}
