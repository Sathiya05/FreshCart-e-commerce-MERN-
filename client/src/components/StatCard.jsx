import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { formatNumber } from '../utils/format.js'

export default function StatCard({
  label,
  value,
  icon: Icon,
  change,
  tone = 'brand',
  prefix = '',
}) {
  const positive = Number(change) >= 0
  const toneClass =
    tone === 'warning'
      ? 'bg-amber-50 text-amber-700'
      : tone === 'info'
        ? 'bg-blue-50 text-blue-700'
        : 'bg-brand-secondary text-brand-dark'

  return (
    <div className="rounded-2xl border border-app-border bg-surface p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-text-secondary">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-text-primary">
            {prefix}
            {typeof value === 'number' ? formatNumber(value) : value}
          </p>
        </div>
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${toneClass}`}>
          <Icon size={19} aria-hidden="true" />
        </span>
      </div>
      {change !== undefined && (
        <p className={`mt-4 inline-flex items-center gap-1 text-xs font-semibold ${positive ? 'text-brand-primary' : 'text-red-600'}`}>
          {positive ? <ArrowUpRight size={14} aria-hidden="true" /> : <ArrowDownRight size={14} aria-hidden="true" />}
          {positive ? '+' : ''}{change}% vs last month
        </p>
      )}
    </div>
  )
}
