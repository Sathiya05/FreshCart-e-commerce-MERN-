import { Star } from 'lucide-react'

export default function Rating({ value = 0, count, size = 14, showValue = true }) {
  const rounded = Math.round(Number(value) || 0)

  return (
    <div className="flex items-center gap-1.5" aria-label={`${value} out of 5 stars`}>
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            className={star <= rounded ? 'fill-brand-accent text-brand-accent' : 'text-app-border'}
            aria-hidden="true"
          />
        ))}
      </div>
      {showValue && (
        <span className="text-xs font-medium text-text-secondary">{Number(value).toFixed(1)}</span>
      )}
      {count !== undefined && (
        <span className="text-xs text-text-secondary">({count})</span>
      )}
    </div>
  )
}
