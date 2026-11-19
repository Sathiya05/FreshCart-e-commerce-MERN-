import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  CreditCard,
  Package,
  RefreshCw,
  ShoppingCart,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import useAdminNotifications from '../hooks/useAdminNotifications.js'
import { SkeletonLine } from './Skeleton.jsx'

const iconByKind = {
  order: ShoppingCart,
  payment: CreditCard,
  stock: Package,
}

const toneStyles = {
  danger: 'bg-red-50 text-red-600',
  warning: 'bg-amber-50 text-amber-700',
  info: 'bg-brand-secondary text-brand-primary',
}

export default function AdminNotifications() {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const {
    notifications,
    seen,
    unreadCount,
    loading,
    refresh,
    markAllRead,
  } = useAdminNotifications()

  useEffect(() => {
    if (!open) return undefined

    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const toggle = () => {
    if (!open) markAllRead()
    setOpen((value) => !value)
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={toggle}
        className="relative grid h-10 w-10 place-items-center rounded-xl text-text-secondary transition-colors hover:bg-app-background hover:text-text-primary"
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell size={19} aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand-accent px-1 text-[10px] font-bold text-brand-dark">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-app-border bg-surface shadow-xl">
          <div className="flex items-center justify-between gap-3 border-b border-app-border px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-primary">Notifications</p>
              <p className="mt-0.5 text-xs text-text-secondary">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'} · updates every minute
              </p>
            </div>
            <button
              type="button"
              onClick={refresh}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-text-secondary hover:bg-app-background"
              aria-label="Refresh notifications"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="space-y-3 p-4">
                {[0, 1, 2].map((item) => (
                  <SkeletonLine key={item} className="h-14 w-full rounded-xl" />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <CheckCheck size={26} className="mx-auto text-brand-primary" aria-hidden="true" />
                <p className="mt-3 text-sm font-medium text-text-primary">Nothing to review</p>
                <p className="mt-1 text-xs text-text-secondary">
                  New orders, failed payments and stock alerts will appear here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-app-border">
                {notifications.map((item) => {
                  const Icon = iconByKind[item.kind] || AlertTriangle
                  const isUnread = !seen.has(item.id)

                  return (
                    <li key={item.id}>
                      <Link
                        to={item.to}
                        onClick={() => setOpen(false)}
                        className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-app-background ${
                          isUnread ? 'bg-brand-secondary/30' : ''
                        }`}
                      >
                        <span
                          className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
                            toneStyles[item.tone] || toneStyles.info
                          }`}
                        >
                          <Icon size={16} aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-text-primary">
                            {item.title}
                          </span>
                          <span className="mt-0.5 block text-xs leading-5 text-text-secondary">
                            {item.message}
                          </span>
                        </span>
                        {isUnread && (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-primary" aria-label="Unread" />
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div className="border-t border-app-border px-4 py-2.5">
            <button
              type="button"
              onClick={markAllRead}
              disabled={unreadCount === 0}
              className="w-full rounded-lg py-1.5 text-xs font-semibold text-brand-primary hover:bg-brand-secondary disabled:text-text-secondary disabled:hover:bg-transparent"
            >
              Mark all as read
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
