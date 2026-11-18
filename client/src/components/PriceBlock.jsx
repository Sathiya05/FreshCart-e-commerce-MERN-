import { formatCurrency } from '../utils/format.js'

export default function PriceBlock({ price, discountPrice, unit, size = 'md' }) {
  const hasDiscount = discountPrice && discountPrice < price
  const priceClass = size === 'lg' ? 'text-3xl' : 'text-lg'

  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span className={`font-bold text-text-primary ${priceClass}`}>
        {formatCurrency(hasDiscount ? discountPrice : price)}
      </span>
      {hasDiscount && (
        <span className="text-sm text-text-secondary line-through">
          {formatCurrency(price)}
        </span>
      )}
      {unit && <span className="text-xs font-medium text-text-secondary">/ {unit}</span>}
    </div>
  )
}
