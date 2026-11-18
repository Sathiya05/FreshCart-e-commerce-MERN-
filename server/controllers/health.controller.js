import { getDatabaseState } from '../config/database.js'
import { env } from '../config/env.js'

export const getHealth = (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      service: 'freshcart-api',
      environment: env.nodeEnv,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      database: getDatabaseState(),
    },
  })
}
