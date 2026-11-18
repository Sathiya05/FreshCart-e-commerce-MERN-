import { ApiError } from './apiError.js'

export const parsePositiveInt = (value, fallback, { min = 1, max = 100 } = {}) => {
  if (value === undefined || value === null || value === '') return fallback
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < min) {
    throw new ApiError(400, 'Invalid pagination value.', 'INVALID_PAGINATION')
  }
  return Math.min(Math.floor(parsed), max)
}

export const buildPagination = (total, page, limit) => ({
  total,
  page,
  limit,
  pages: Math.max(Math.ceil(total / limit), 1),
})
