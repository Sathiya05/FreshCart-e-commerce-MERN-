import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, description, children, footer }) {
  useEffect(() => {
    if (!open) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-[2px] sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-app-border bg-surface shadow-xl sm:max-w-lg sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-start justify-between gap-4 border-b border-app-border p-5">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
            {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-secondary hover:bg-app-background"
            aria-label="Close dialog"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="p-5">{children}</div>
        {footer && (
          <div className="flex flex-wrap justify-end gap-3 border-t border-app-border p-5">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
