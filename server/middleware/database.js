import { getDatabaseState } from '../config/database.js'
import { ApiError } from '../utils/apiError.js'

export const requireDatabase = (_req, _res, next) => {
  if (getDatabaseState() !== 'connected') {
    return next(
      new ApiError(
        503,
        'Database is not available. Configure MONGODB_URI and restart the API.',
        'DATABASE_UNAVAILABLE',
      ),
    )
  }
  next()
}
