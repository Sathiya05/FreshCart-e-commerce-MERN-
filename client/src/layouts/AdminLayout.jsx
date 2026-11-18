import { useState } from 'react'
import {
  BarChart3,
  Bell,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  Search,
  Settings,
  ShoppingCart,
  Tags,
  TicketPercent,
  Users,
  Warehouse,
  X,
} from 'lucide-react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../redux/hooks.js'
import { selectCurrentUser, signOut } from '../redux/authSlice.js'
import { pushToast } from '../redux/uiSlice.js'
import BrandLogo from '../components/BrandLogo.jsx'
import DemoBadge from '../components/DemoBadge.jsx'
import ToastHost from '../components/ToastHost.jsx'

const navItems = [
  { label: 'Overview', to: '/admin', icon: LayoutDashboard, end: true },
  { label: 'Products', to: '/admin/products', icon: Package },
  { label: 'Categories', to: '/admin/categories', icon: Tags },
  { label: 'Inventory', to: '/admin/inventory', icon: Warehouse },
  { label: 'Orders', to: '/admin/orders', icon: ShoppingCart },
  { label: 'Customers', to: '/admin/customers', icon: Users },
  { label: 'Coupons', to: '/admin/coupons', icon: TicketPercent },
  { label: 'Reviews', to: '/admin/reviews', icon: MessageSquare },
  { label: 'Sales Reports', to: '/admin/reports', icon: BarChart3 },
  { label: 'Settings', to: '/admin/settings', icon: Settings },
]

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-brand-secondary text-brand-dark'
      : 'text-text-secondary hover:bg-app-background hover:text-text-primary'
  }`

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const user = useAppSelector(selectCurrentUser)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const handleSignOut = () => {
    dispatch(signOut())
    dispatch(pushToast({ type: 'info', message: 'Admin demo session ended.' }))
    navigate('/login')
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="border-b border-app-border px-5 py-5">
        <BrandLogo compact />
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-text-secondary">
          Admin console
        </p>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5" aria-label="Admin navigation">
        {navItems.map(({ label, to, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={linkClass}
            onClick={() => setMobileOpen(false)}
          >
            <Icon size={17} aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-app-border p-4">
        <Link
          to="/"
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-text-secondary hover:bg-app-background"
        >
          <ExternalLink size={16} aria-hidden="true" />
          View storefront
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
        >
          <LogOut size={16} aria-hidden="true" />
          Sign out
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-app-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-app-border bg-surface lg:block">
        {sidebar}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
            aria-label="Close admin navigation"
          />
          <aside className="absolute inset-y-0 left-0 w-72 bg-surface shadow-xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 rounded-lg p-2 text-text-secondary hover:bg-app-background"
              aria-label="Close navigation"
            >
              <X size={18} aria-hidden="true" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-app-border bg-surface/95 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-text-secondary hover:bg-app-background lg:hidden"
            aria-label="Open admin navigation"
          >
            <Menu size={20} aria-hidden="true" />
          </button>
          <div className="hidden max-w-sm flex-1 md:block">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
              <input
                type="search"
                placeholder="Search admin…"
                aria-label="Search admin"
                className="h-10 w-full rounded-xl border border-app-border bg-app-background/60 pl-9 pr-3 text-sm outline-none focus:border-brand-primary"
              />
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <DemoBadge className="hidden sm:inline-flex" />
            <button type="button" className="relative grid h-10 w-10 place-items-center rounded-xl text-text-secondary hover:bg-app-background" aria-label="Notifications">
              <Bell size={19} aria-hidden="true" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand-accent" />
            </button>
            <div className="flex items-center gap-2 rounded-xl border border-app-border px-2 py-1.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-secondary text-xs font-bold text-brand-dark">
                {user?.name?.charAt(0) || 'A'}
              </span>
              <span className="hidden text-sm font-medium text-text-primary sm:inline">
                {user?.name || 'Admin'}
              </span>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
      <ToastHost />
    </div>
  )
}
