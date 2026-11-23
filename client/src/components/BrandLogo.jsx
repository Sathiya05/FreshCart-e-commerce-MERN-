import { Leaf } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function BrandLogo({
  compact = false,
  light = false,
  to = '/',
  className = '',
  wordmarkClassName = '',
}) {
  return (
    <Link
      to={to}
      className={`group inline-flex items-center gap-3 ${className}`}
      aria-label="FreshCart home"
    >
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl shadow-sm transition-colors ${
          light ? 'bg-white text-brand-primary' : 'bg-brand-primary text-white group-hover:bg-brand-dark'
        }`}
      >
        <Leaf size={22} strokeWidth={2.2} aria-hidden="true" />
      </span>
      <span className={`leading-tight ${wordmarkClassName}`}>
        <span
          className={`block text-lg font-bold tracking-tight ${
            light ? 'text-white' : 'text-text-primary'
          }`}
        >
          FreshCart
        </span>
        {!compact && (
          <span className={`block text-xs ${light ? 'text-green-100' : 'text-text-secondary'}`}>
            Fresh groceries, delivered with care.
          </span>
        )}
      </span>
    </Link>
  )
}
