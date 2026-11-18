import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export default function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-brand-primary">
            {eyebrow}
          </p>
        )}
        <h2 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
          {title}
        </h2>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
            {description}
          </p>
        )}
      </div>
      {action && (
        <Link
          to={action.to}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-primary hover:text-brand-dark"
        >
          {action.label}
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      )}
    </div>
  )
}
