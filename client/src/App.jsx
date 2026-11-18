import { useEffect, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Database,
  Leaf,
  LoaderCircle,
  Server,
} from 'lucide-react'
import { healthCheck } from './services/api.js'

const initialState = {
  status: 'loading',
  data: null,
  error: null,
}

function HealthCard({ health }) {
  const { status, data, error } = health
  const isConnected = data?.database === 'connected'

  return (
    <section
      className="rounded-2xl border border-app-border bg-surface p-6 shadow-sm sm:p-7"
      aria-live="polite"
      aria-label="Backend health status"
    >
      <div className="flex items-center gap-3 border-b border-app-border pb-5">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-secondary text-brand-dark">
          <Server size={20} strokeWidth={2} aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-semibold text-text-primary">Backend health check</h2>
          <p className="text-sm text-text-secondary">GET /api/health</p>
        </div>
      </div>

      {status === 'loading' && (
        <div className="flex items-center gap-3 py-7 text-text-secondary">
          <LoaderCircle
            className="animate-spin text-brand-primary"
            size={20}
            aria-hidden="true"
          />
          <span>Connecting to the FreshCart API…</span>
        </div>
      )}

      {status === 'error' && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle
              className="mt-0.5 shrink-0 text-red-600"
              size={20}
              aria-hidden="true"
            />
            <div>
              <p className="font-medium text-red-800">API connection failed</p>
              <p className="mt-1 text-sm text-red-700">
                {error || 'Start the backend server and try again.'}
              </p>
              <p className="mt-3 text-xs text-red-600">
                Expected backend at http://localhost:5000 in local development.
              </p>
            </div>
          </div>
        </div>
      )}

      {status === 'success' && data && (
        <div className="mt-6 space-y-5">
          <div
            className={`flex items-start gap-3 rounded-xl border p-4 ${
              isConnected
                ? 'border-green-200 bg-green-50'
                : 'border-amber-200 bg-amber-50'
            }`}
          >
            {isConnected ? (
              <CheckCircle2
                className="mt-0.5 shrink-0 text-brand-primary"
                size={20}
                aria-hidden="true"
              />
            ) : (
              <Database
                className="mt-0.5 shrink-0 text-amber-600"
                size={20}
                aria-hidden="true"
              />
            )}
            <div>
              <p
                className={`font-medium ${
                  isConnected ? 'text-brand-dark' : 'text-amber-900'
                }`}
              >
                API is responding
              </p>
              <p
                className={`mt-1 text-sm ${
                  isConnected ? 'text-green-800' : 'text-amber-800'
                }`}
              >
                {isConnected
                  ? 'MongoDB Atlas is connected.'
                  : 'MongoDB is not connected. Add MONGODB_URI to server/.env to enable database features.'}
              </p>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-app-background p-3">
              <dt className="text-xs text-text-secondary">Service</dt>
              <dd className="mt-1 font-medium">{data.service}</dd>
            </div>
            <div className="rounded-xl bg-app-background p-3">
              <dt className="text-xs text-text-secondary">Environment</dt>
              <dd className="mt-1 font-medium">{data.environment}</dd>
            </div>
            <div className="rounded-xl bg-app-background p-3">
              <dt className="text-xs text-text-secondary">Database</dt>
              <dd className="mt-1 font-medium capitalize">{data.database}</dd>
            </div>
            <div className="rounded-xl bg-app-background p-3">
              <dt className="text-xs text-text-secondary">Uptime</dt>
              <dd className="mt-1 font-medium">{data.uptimeSeconds}s</dd>
            </div>
          </dl>

          <p className="text-xs text-text-secondary">
            Last checked: {new Date(data.timestamp).toLocaleString()}
          </p>
        </div>
      )}
    </section>
  )
}

export default function App() {
  const [health, setHealth] = useState(initialState)

  useEffect(() => {
    const controller = new AbortController()

    async function checkBackend() {
      try {
        const response = await healthCheck({ signal: controller.signal })
        setHealth({
          status: 'success',
          data: response.data?.data || null,
          error: null,
        })
      } catch (error) {
        if (error.code === 'ERR_CANCELED') return
        const message =
          error.response?.data?.error?.message ||
          error.message ||
          'Unable to reach the backend.'
        setHealth({ status: 'error', data: null, error: message })
      }
    }

    checkBackend()
    return () => controller.abort()
  }, [])

  return (
    <div className="min-h-screen bg-app-background">
      <header className="border-b border-app-border bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-primary text-white shadow-sm">
              <Leaf size={22} strokeWidth={2.2} aria-hidden="true" />
            </span>
            <div>
              <p className="text-lg font-bold tracking-tight text-text-primary">
                FreshCart
              </p>
              <p className="text-xs text-text-secondary">
                Grocery commerce platform
              </p>
            </div>
          </div>
          <span className="hidden rounded-full bg-brand-secondary px-3 py-1 text-xs font-semibold text-brand-dark sm:inline-flex">
            Phase 1 — Foundation
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <span className="inline-flex rounded-full border border-app-border bg-surface px-3 py-1 text-xs font-semibold text-brand-dark">
              Setup verification
            </span>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">
              Fresh groceries,
              <span className="block text-brand-primary">built on a solid foundation.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-text-secondary">
              This screen confirms that the React frontend and Express API can
              communicate. Phase 2 will replace it with the full FreshCart storefront.
            </p>
            <div className="mt-7 flex flex-wrap gap-3 text-sm">
              <span className="rounded-lg border border-app-border bg-surface px-3 py-2 text-text-secondary">
                React + Vite
              </span>
              <span className="rounded-lg border border-app-border bg-surface px-3 py-2 text-text-secondary">
                Tailwind CSS v4
              </span>
              <span className="rounded-lg border border-app-border bg-surface px-3 py-2 text-text-secondary">
                Express + MongoDB
              </span>
            </div>
          </div>

          <HealthCard health={health} />
        </div>
      </main>
    </div>
  )
}
