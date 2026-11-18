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
  headers: {
    'Content-Type': 'application/json',
  },
})

export const healthCheck = (config = {}) => api.get('/health', config)

export default api
