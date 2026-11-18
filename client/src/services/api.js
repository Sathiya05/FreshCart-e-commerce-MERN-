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
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

let refreshRequest = null

const isAuthEndpoint = (url = '') =>
  /\/(login|register|refresh|logout)(\?|$)/.test(url)

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const status = error.response?.status

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthEndpoint(originalRequest.url)
    ) {
      originalRequest._retry = true

      if (!refreshRequest) {
        refreshRequest = api
          .post('/auth/refresh')
          .then(() => true)
          .catch(() => false)
          .finally(() => {
            refreshRequest = null
          })
      }

      if (await refreshRequest) {
        return api(originalRequest)
      }
    }

    const apiError = error.response?.data?.error
    if (apiError?.message) error.message = apiError.message
    return Promise.reject(error)
  },
)

export const getApiErrorMessage = (error, fallback = 'Something went wrong. Please try again.') =>
  error?.response?.data?.error?.message || error?.message || fallback

export const healthCheck = (config = {}) => api.get('/health', config)

export default api
