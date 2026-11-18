import { LockKeyhole } from 'lucide-react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAppSelector } from '../redux/hooks.js'
import { selectCurrentUser } from '../redux/authSlice.js'
import Button from '../components/Button.jsx'

export default function AdminRoute({ children }) {
  const user = useAppSelector(selectCurrentUser)
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (user.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app-background px-4">
        <div className="max-w-md rounded-2xl border border-app-border bg-surface p-8 text-center shadow-sm">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-red-600">
            <LockKeyhole size={26} aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-xl font-bold">Admin access required</h1>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            Your current demo session does not have administrator privileges.
            Sign in with the admin demo account to view this area.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button as={Link} to="/">Back to store</Button>
            <Button as={Link} to="/login" variant="outline">Switch account</Button>
          </div>
        </div>
      </div>
    )
  }

  return children
}
