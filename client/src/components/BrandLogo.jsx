import { Link } from 'react-router-dom'
import FreshCartMark from './FreshCartMark.jsx'

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
      className={`group inline-flex items-center gap-2 sm:gap-3 ${className}`}
      aria-label="FreshCart home"
    >
      <FreshCartMark
        className={`h-9 w-9 shrink-0 rounded-xl transition-shadow sm:h-10 sm:w-10 ${
          light ? 'shadow-[0_0_0_2px_rgba(255,255,255,0.22)]' : 'shadow-sm group-hover:shadow-md'
        }`}
      />
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
