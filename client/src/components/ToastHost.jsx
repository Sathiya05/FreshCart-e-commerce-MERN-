import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../redux/hooks.js'
import { dismissToast, selectToasts } from '../redux/uiSlice.js'

const toneStyles = {
  success: 'border-green-200 bg-green-50 text-brand-dark',
  error: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-blue-200 bg-blue-50 text-blue-800',
}

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}

function ToastItem({ toast }) {
  const dispatch = useAppDispatch()
  const Icon = icons[toast.type] || Info

  useEffect(() => {
    const timer = setTimeout(() => dispatch(dismissToast(toast.id)), 4200)
    return () => clearTimeout(timer)
  }, [dispatch, toast.id])

  return (
    <div
      className={`pointer-events-auto flex w-full items-start gap-3 rounded-xl border p-4 shadow-sm ${toneStyles[toast.type] || toneStyles.info}`}
      role="status"
    >
      <Icon size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {toast.title && <p className="break-words text-sm font-semibold">{toast.title}</p>}
        <p className="break-words text-sm leading-5">{toast.message}</p>
      </div>
      <button
        type="button"
        onClick={() => dispatch(dismissToast(toast.id))}
        className="-mr-2 -mt-2 grid h-10 w-10 shrink-0 place-items-center rounded-md opacity-70 hover:opacity-100"
        aria-label="Dismiss notification"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  )
}

export default function ToastHost({ avoidFloatingDock = false, className = '' }) {
  const toasts = useAppSelector(selectToasts)
  const { pathname } = useLocation()
  const hasBottomCta = pathname === '/cart' || pathname === '/checkout'

  const positionClasses = className
    ? ''
    : avoidFloatingDock
      ? `left-3 right-20 sm:left-auto sm:right-36 ${
          hasBottomCta ? 'toast-bottom-cta' : 'toast-bottom'
        }`
      : 'inset-x-3 toast-bottom sm:inset-x-auto sm:right-6'

  return (
    <div
      className={`pointer-events-none fixed z-[60] flex max-h-[60dvh] max-w-[calc(100vw-1.5rem)] flex-col gap-2 overflow-y-auto sm:w-96 sm:max-w-none ${positionClasses} ${className}`}
    >
      {toasts.slice(0, 2).map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}
