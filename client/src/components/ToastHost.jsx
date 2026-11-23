import { useEffect } from 'react'
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
        {toast.title && <p className="text-sm font-semibold">{toast.title}</p>}
        <p className="text-sm leading-5">{toast.message}</p>
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

export default function ToastHost({ avoidFloatingDock = false }) {
  const toasts = useAppSelector(selectToasts)

  // Customer pages reserve a right gutter for the floating AI/WhatsApp dock,
  // so notifications stay bottom-aligned without covering the buttons.
  const positionClasses = avoidFloatingDock
    ? 'bottom-4 left-4 right-20 w-auto sm:bottom-6 sm:left-auto sm:right-28 sm:w-96'
    : 'inset-x-4 bottom-4 sm:inset-x-auto sm:right-6 sm:w-96'

  return (
    <div className={`pointer-events-none fixed z-[60] flex flex-col gap-2 ${positionClasses}`}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}
