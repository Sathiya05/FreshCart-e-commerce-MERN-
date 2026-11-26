import { useEffect } from 'react'
import { LoaderCircle } from 'lucide-react'
import AppRoutes from './routes/AppRoutes.jsx'
import { useAppDispatch, useAppSelector } from './redux/hooks.js'
import { restoreSession, selectAuthInitialized, signOut } from './redux/authSlice.js'
import { pushToast } from './redux/uiSlice.js'
import { setUnauthorizedHandler } from './services/api.js'

// StrictMode intentionally runs effects twice in development. Restoring twice
// can issue two /auth/refresh calls with rotating cookies, so guard it.
let restoreStarted = false

export default function App() {
  const dispatch = useAppDispatch()
  const initialized = useAppSelector(selectAuthInitialized)

  useEffect(() => {
    if (restoreStarted) return undefined
    restoreStarted = true

    const restoration = dispatch(restoreSession())
    // A cold API can be slow; never leave a customer staring at the spinner.
    const timeout = window.setTimeout(() => dispatch(signOut()), 20000)
    restoration.finally(() => window.clearTimeout(timeout))

    return undefined
  }, [dispatch])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      dispatch(signOut())
      dispatch(
        pushToast({
          type: 'info',
          message: 'Your session has expired. Please sign in again.',
        }),
      )
    })

    return () => setUnauthorizedHandler(null)
  }, [dispatch])

  if (!initialized) {
    return (
      <div
        className="flex min-h-dvh items-center justify-center bg-app-background text-text-secondary"
        role="status"
      >
        <LoaderCircle
          className="mr-2 animate-spin text-brand-primary"
          size={20}
          aria-hidden="true"
        />
        Loading FreshCart…
      </div>
    )
  }

  return <AppRoutes />
}
