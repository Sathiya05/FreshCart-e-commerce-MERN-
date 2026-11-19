import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import AnnouncementBar from '../components/AnnouncementBar.jsx'
import Footer from '../components/Footer.jsx'
import Navbar from '../components/Navbar.jsx'
import ToastHost from '../components/ToastHost.jsx'
import { selectAuthInitialized, selectCurrentUser } from '../redux/authSlice.js'
import { syncGuestCart } from '../redux/cartSlice.js'
import { useAppDispatch, useAppSelector } from '../redux/hooks.js'

export default function CustomerLayout() {
  const dispatch = useAppDispatch()
  const user = useAppSelector(selectCurrentUser)
  const initialized = useAppSelector(selectAuthInitialized)

  useEffect(() => {
    if (initialized && user?.role === 'customer') {
      dispatch(syncGuestCart())
    }
  }, [dispatch, initialized, user?.id, user?.role])

  return (
    <div className="flex min-h-screen flex-col bg-app-background">
      <AnnouncementBar />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <ToastHost />
    </div>
  )
}
