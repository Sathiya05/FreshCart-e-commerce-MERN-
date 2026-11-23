import { useEffect } from 'react'
import { LoaderCircle } from 'lucide-react'
import AppRoutes from './routes/AppRoutes.jsx'
import { useAppDispatch, useAppSelector } from './redux/hooks.js'
import { restoreSession, selectAuthInitialized, signOut } from './redux/authSlice.js'
import { pushToast } from './redux/uiSlice.js'
import { setUnauthorizedHandler } from './services/api.js'

export default function App() {
  const dispatch = useAppDispatch()
  const initialized = useAppSelector(selectAuthInitialized)

  useEffect(() => {
    dispatch(restoreSession())
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
        className="flex min-h-screen items-center justify-center bg-app-background text-text-secondary"
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
