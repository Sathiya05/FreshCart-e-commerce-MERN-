import { AlertTriangle, RefreshCw } from 'lucide-react'
import Button from './Button.jsx'

export default function ErrorState({
  message = 'We could not load this section.',
  onRetry,
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-xl bg-white text-red-600">
        <AlertTriangle size={24} aria-hidden="true" />
      </span>
      <h3 className="mt-4 font-semibold text-red-900">Something went wrong</h3>
      <p className="mt-2 max-w-md text-sm text-red-700">{message}</p>
      {onRetry && (
        <Button className="mt-5" variant="outline" onClick={onRetry}>
          <RefreshCw size={16} aria-hidden="true" />
          Try again
        </Button>
      )}
    </div>
  )
}
