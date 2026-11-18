import axios from 'axios'

/**
 * Shared Axios client for all FreshCart API calls.
 *
 * Local development uses the Vite proxy (/api -> localhost:5000).
 * Deployed builds can set VITE_API_URL to a full API origin, e.g.
 * https://api.example.com/api
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError = error.response?.data?.error
    if (apiError?.message) error.message = apiError.message
    return Promise.reject(error)
  },
)

export const healthCheck = (config = {}) => api.get('/health', config)

export default api
