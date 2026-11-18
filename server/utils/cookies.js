import { env } from '../config/env.js'

const durationToMs = (value, fallback) => {
  const match = /^(\d+)([smhd])$/.exec(String(value || ''))
  if (!match) return fallback
  const amount = Number(match[1])
  const multiplier = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 }[
    match[2]
  ]
  return amount * multiplier
}

const baseOptions = {
  httpOnly: true,
  secure: env.cookieSecure,
  sameSite: env.cookieSameSite,
  path: '/api',
  ...(env.cookieDomain ? { domain: env.cookieDomain } : {}),
}

export const setAuthCookies = (res, { accessToken, refreshToken }) => {
  res.cookie(env.accessCookieName, accessToken, {
    ...baseOptions,
    maxAge: durationToMs(env.jwtExpiresIn, 15 * 60 * 1000),
  })
  res.cookie(env.refreshCookieName, refreshToken, {
    ...baseOptions,
    maxAge: durationToMs(env.jwtRefreshExpiresIn, 7 * 24 * 60 * 60 * 1000),
  })
}

export const clearAuthCookies = (res) => {
  res.clearCookie(env.accessCookieName, baseOptions)
  res.clearCookie(env.refreshCookieName, baseOptions)
}
