import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import AnnouncementBar from '../components/AnnouncementBar.jsx'
import FloatingActions from '../components/FloatingActions.jsx'
import Footer from '../components/Footer.jsx'
import Navbar from '../components/Navbar.jsx'
import ToastHost from '../components/ToastHost.jsx'
import { selectAuthInitialized, selectCurrentUser } from '../redux/authSlice.js'
import { fetchCustomerCart } from '../redux/cartSlice.js'
import { useAppDispatch, useAppSelector } from '../redux/hooks.js'

export default function CustomerLayout() {
  const location = useLocation()
  const dispatch = useAppDispatch()
  const user = useAppSelector(selectCurrentUser)
  const initialized = useAppSelector(selectAuthInitialized)
  const hydratedFor = useRef(null)

  useEffect(() => {
    if (!initialized || !user) return
    const key = `${user.id}:${user.role}`
    if (hydratedFor.current === key) return
    hydratedFor.current = key
    dispatch(fetchCustomerCart())
  }, [dispatch, initialized, user?.id, user?.role])

  useEffect(() => {
    const onVisible = () => {
      if (
        document.visibilityState === 'visible' &&
        initialized &&
        user?.role === 'customer'
      ) {
        dispatch(fetchCustomerCart())
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [dispatch, initialized, user?.id, user?.role])

  const hasBottomCta = location.pathname === '/cart' || location.pathname === '/checkout'

  return (
    <div className="flex min-h-dvh flex-col bg-app-background">
      <AnnouncementBar />
      <Navbar />
      <main className="flex-1">
        <div className="min-w-0 animate-page-in">
          <Outlet />
        </div>
      </main>
      <div className={hasBottomCta ? 'pb-24 lg:pb-0' : ''}>
        <Footer />
      </div>
      <FloatingActions />
      <ToastHost avoidFloatingDock />
    </div>
  )
}
