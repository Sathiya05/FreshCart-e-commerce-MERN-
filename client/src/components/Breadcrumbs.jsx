import { ChevronRight, Home } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Breadcrumbs({ items = [] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-text-secondary">
      <Link to="/" className="inline-flex items-center gap-1 hover:text-brand-primary">
        <Home size={14} aria-hidden="true" />
        Home
      </Link>
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="inline-flex items-center gap-1.5">
          <ChevronRight size={14} aria-hidden="true" />
          {item.to ? (
            <Link to={item.to} className="hover:text-brand-primary">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-text-primary">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
