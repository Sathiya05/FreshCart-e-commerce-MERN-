import { Navigate, useLocation } from 'react-router-dom'
import { useAppSelector } from '../redux/hooks.js'
import { selectCurrentUser } from '../redux/authSlice.js'

export default function ProtectedRoute({ children, roles }) {
  const user = useAppSelector(selectCurrentUser)
  const location = useLocation()

  if (!user) {
    // Forward the whole location so query strings and hashes survive login.
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <Navigate
        to={user.role === 'admin' ? '/admin' : '/'}
        replace
        state={{ from: location }}
      />
    )
  }

  return children
}
