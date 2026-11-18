import { Navigate, useLocation } from 'react-router-dom'
import { useAppSelector } from '../redux/hooks.js'
import { selectCurrentUser } from '../redux/authSlice.js'

export default function ProtectedRoute({ children }) {
  const user = useAppSelector(selectCurrentUser)
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}
