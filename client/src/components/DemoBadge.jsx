import { FlaskConical } from 'lucide-react'

export default function DemoBadge({ className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ${className}`}
      title="Preview data for a feature that is not connected to an API yet."
    >
      <FlaskConical size={13} aria-hidden="true" />
      Demo data
    </span>
  )
}
