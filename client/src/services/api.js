import axios from 'axios'

/**
 * Shared Axios client for all FreshCart API calls.
 *
 * Local development uses the Vite proxy (/api -> localhost:5000).
 * Deployed builds can set VITE_API_URL to a full API origin, e.g.
 * https://api.example.com/api
 *
 * Sessions use HttpOnly cookies. An expired access token triggers one silent
 * refresh request before the original call is retried.
 */
const configuredBaseUrl = import.meta.env.VITE_API_URL || '/api'

// Render's free tier can take longer than 10 seconds to wake an idle service.
// Keep a generous timeout so a cold start does not look like a failed sign-in.
const REQUEST_TIMEOUT_MS = 60000

const api = axios.create({
  baseURL: configuredBaseUrl.trim(),
  timeout: REQUEST_TIMEOUT_MS,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

let refreshRequest = null
let unauthorizedHandler = null
let accessToken = null

/** Lets the app drop its auth state when a session cannot be renewed. */
export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler
}

/**
 * In-memory access token fallback. Used when cross-site cookies are blocked in
 * production; the backend also accepts Authorization: Bearer <token>.
 */
export const setAccessToken = (token) => {
  accessToken = typeof token === 'string' && token ? token : null
}

export const getAccessToken = () => accessToken

const isAuthEndpoint = (url = '') =>
  /\/(login|register|refresh|logout|google)(\/|\?|$)/.test(url)

/**
 * An expired session only needs local cleanup. Calling /auth/logout here used
 * to bump tokenVersion asynchronously and could invalidate a newer session
 * created in another tab before the logout request finished.
 */
const clearExpiredSession = () => {
  setAccessToken(null)
  unauthorizedHandler?.()
}

api.interceptors.request.use((config) => {
  if (accessToken && !config.headers?.Authorization) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

api.interceptors.response.use(
  (response) => {
    // A misconfigured static host returns index.html for /api/*. Fail loudly
    // instead of letting services unwrap `undefined` into a signed-in user.
    if (
      typeof response.data === 'string' &&
      /^\s*(<!doctype html|<html)/i.test(response.data)
    ) {
      const error = new Error(
        'The API returned HTML instead of JSON. Check the VITE_API_URL build setting.',
      )
      error.code = 'NON_JSON_API_RESPONSE'
      return Promise.reject(error)
    }
    return response
  },
  async (error) => {
    const originalRequest = error.config
    const status = error.response?.status
    let sessionExpired = false

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.skipAuthRefresh &&
      !originalRequest.skipSessionCleanup &&
      !isAuthEndpoint(originalRequest.url)
    ) {
      originalRequest._retry = true

      if (!refreshRequest) {
        refreshRequest = api
          .post('/auth/refresh')
          .then((response) => {
            const nextToken = response?.data?.data?.accessToken
            if (nextToken) setAccessToken(nextToken)
            return true
          })
          .catch(() => false)
          .finally(() => {
            refreshRequest = null
          })
      }

      if (await refreshRequest) {
        return api(originalRequest)
      }

      sessionExpired = true
      clearExpiredSession()
    }

    const apiError = error.response?.data?.error
    if (sessionExpired) {
      error.message = 'Your session has expired. Please sign in again.'
    } else if (apiError?.message) {
      error.message = apiError.message
    } else if (!error.response) {
      const isTimeout =
        error.code === 'ECONNABORTED' || /timeout/i.test(error?.message || '')
      error.message = isTimeout
        ? 'The server is taking longer than expected to respond. It may be waking up — please try again.'
        : 'Could not reach the server. Check your connection and try again.'
    }
    return Promise.reject(error)
  },
)

export const getApiErrorMessage = (error, fallback = 'Something went wrong. Please try again.') =>
  error?.response?.data?.error?.message || error?.message || fallback

export const healthCheck = (config = {}) => api.get('/health', config)

export default api
