import { useEffect, useRef, useState } from 'react'
import {
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  ShoppingCart,
  UserRound,
  X,
} from 'lucide-react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../redux/hooks.js'
import { selectCartCount } from '../redux/cartSlice.js'
import { selectWishlistIds } from '../redux/wishlistSlice.js'
import { logoutUser, selectCurrentUser } from '../redux/authSlice.js'
import { pushToast } from '../redux/uiSlice.js'
import BrandLogo from './BrandLogo.jsx'

const links = [
  { label: 'Home', to: '/' },
  { label: 'Shop', to: '/shop' },
  { label: 'Categories', to: '/categories' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
]

const navClass = ({ isActive }) =>
  `text-sm font-medium transition-colors ${
    isActive ? 'text-brand-primary' : 'text-text-secondary hover:text-text-primary'
  }`

export default function Navbar() {
  const [query, setQuery] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const accountRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const cartCount = useAppSelector(selectCartCount)
  const wishlistCount = useAppSelector(selectWishlistIds).length
  const user = useAppSelector(selectCurrentUser)

  useEffect(() => {
    setMobileOpen(false)
    setAccountOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!mobileOpen) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onResize = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false)
    }
    window.addEventListener('resize', onResize)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('resize', onResize)
    }
  }, [mobileOpen])

  useEffect(() => {
    if (!accountOpen) return undefined

    const onPointerDown = (event) => {
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setAccountOpen(false)
      }
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setAccountOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [accountOpen])

  const handleSearch = (event) => {
    event.preventDefault()
    const term = query.trim()
    if (!term) return
    navigate(`/search?q=${encodeURIComponent(term)}`)
    setQuery('')
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }

  const handleSignOut = async () => {
    await dispatch(logoutUser())
    dispatch(pushToast({ type: 'info', message: 'You have signed out.' }))
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-app-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-16 min-w-0 max-w-7xl items-center gap-2 px-3 sm:gap-4 sm:px-6">
        <button
          type="button"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-text-secondary hover:bg-app-background lg:hidden"
          onClick={() => setMobileOpen((value) => !value)}
          aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={21} aria-hidden="true" /> : <Menu size={21} aria-hidden="true" />}
        </button>

        <BrandLogo compact className="shrink-0" wordmarkClassName="hidden sm:block" />

        <nav className="ml-2 hidden min-w-0 items-center gap-4 lg:flex xl:ml-4 xl:gap-6" aria-label="Main navigation">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} onClick={scrollToTop} className={navClass} end={link.to === '/'}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <form onSubmit={handleSearch} className="ml-auto hidden min-w-0 max-w-sm flex-1 md:block">
          <label htmlFor="site-search" className="sr-only">
            Search groceries
          </label>
          <div className="relative min-w-0">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
            <input
              id="site-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search fresh groceries…"
              className="h-10 w-full rounded-xl border border-app-border bg-app-background/60 pl-10 pr-3 text-sm outline-none focus:border-brand-primary focus:bg-surface focus:ring-2 focus:ring-brand-primary/10"
            />
          </div>
        </form>

        <div className="ml-auto flex shrink-0 items-center gap-1 md:ml-0">
          <Link
            to="/wishlist"
            className="relative grid h-11 w-11 place-items-center rounded-xl text-text-secondary hover:bg-app-background hover:text-brand-primary"
            aria-label={`Wishlist, ${wishlistCount} items`}
          >
            <Heart size={20} aria-hidden="true" />
            {wishlistCount > 0 && (
              <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand-accent px-1 text-[10px] font-bold text-[#3d2f00]">
                {wishlistCount}
              </span>
            )}
          </Link>
          <Link
            to="/cart"
            className="relative grid h-11 w-11 place-items-center rounded-xl text-text-secondary hover:bg-app-background hover:text-brand-primary"
            aria-label={`Cart, ${cartCount} items`}
          >
            <ShoppingCart size={20} aria-hidden="true" />
            {cartCount > 0 && (
              <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand-primary px-1 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>
          {user ? (
            <div className="relative" ref={accountRef}>
              <button
                type="button"
                onClick={() => setAccountOpen((value) => !value)}
                className="flex h-11 items-center gap-2 rounded-xl px-2 text-sm font-medium text-text-secondary hover:bg-app-background"
                aria-label="Account menu"
                aria-haspopup="true"
                aria-expanded={accountOpen}
              >
                <UserRound size={19} aria-hidden="true" />
                <span className="hidden xl:inline">{user.name.split(' ')[0]}</span>
              </button>
              {accountOpen && (
                <div className="absolute right-0 top-11 z-50 w-52 rounded-xl border border-app-border bg-surface p-2 shadow-lg">
                  <Link to="/account/profile" className="block rounded-lg px-3 py-2 text-sm text-text-secondary hover:bg-app-background">
                    My profile
                  </Link>
                  {user.role === 'admin' && (
                    <Link to="/admin" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary hover:bg-app-background">
                      <LayoutDashboard size={15} aria-hidden="true" />
                      Admin dashboard
                    </Link>
                  )}
                  <button type="button" onClick={handleSignOut} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">
                    <LogOut size={15} aria-hidden="true" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="ml-1 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-primary px-3 text-sm font-semibold text-white hover:bg-brand-dark sm:px-4"
            >
              <UserRound size={17} aria-hidden="true" />
              <span className="hidden sm:inline">Sign in</span>
            </Link>
          )}
        </div>
      </div>

      {mobileOpen && (
        <div className="max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-t border-app-border bg-surface lg:hidden">
          <form onSubmit={handleSearch} className="px-4 py-3 md:hidden">
            <div className="relative">
              <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search groceries…"
                aria-label="Search groceries"
                className="h-10 w-full rounded-xl border border-app-border bg-app-background/60 pl-10 pr-3 text-sm outline-none focus:border-brand-primary"
              />
            </div>
          </form>
          <nav className="space-y-1 px-4 pb-2" aria-label="Mobile navigation">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} onClick={() => { scrollToTop(); setMobileOpen(false) }} className={({ isActive }) => `block rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-brand-secondary text-brand-dark' : 'text-text-secondary'}`} end={link.to === '/'}>
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="border-t border-app-border px-4 py-3">
            {user ? (
              <>
                <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  {user.name}
                </p>
                <Link to="/account/profile" className="block rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary">
                  My profile
                </Link>
                {user.role === 'admin' && (
                  <Link to="/admin" className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary">
                    <LayoutDashboard size={16} aria-hidden="true" />
                    Admin dashboard
                  </Link>
                )}
                <button type="button" onClick={handleSignOut} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600">
                  <LogOut size={16} aria-hidden="true" />
                  Sign out
                </button>
              </>
            ) : (
              <Link to="/login" className="flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-3 text-sm font-semibold text-white">
                <UserRound size={17} aria-hidden="true" />
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
