import { useEffect } from 'react'
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

  useEffect(() => {
    if (!initialized) return
    dispatch(fetchCustomerCart())
  }, [dispatch, initialized, user?.id, user?.role])

  return (
    <div className="flex min-h-screen flex-col bg-app-background">
      <AnnouncementBar />
      <Navbar />
      <main className="flex-1">
        <div key={location.pathname} className="animate-page-in">
          <Outlet />
        </div>
      </main>
      <Footer />
      <FloatingActions />
      <ToastHost avoidFloatingDock />
    </div>
  )
}
