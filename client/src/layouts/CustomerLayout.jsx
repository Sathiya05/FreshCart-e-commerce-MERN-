import { Outlet } from 'react-router-dom'
import AnnouncementBar from '../components/AnnouncementBar.jsx'
import Footer from '../components/Footer.jsx'
import Navbar from '../components/Navbar.jsx'
import ToastHost from '../components/ToastHost.jsx'

export default function CustomerLayout() {
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
