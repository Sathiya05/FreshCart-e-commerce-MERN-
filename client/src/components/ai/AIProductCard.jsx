import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { formatCurrency } from '../../utils/format.js'

/**
 * Product card rendered inside AI chat responses. It is intentionally isolated
 * from demo data: product fields must come from the backend catalog service.
 */
export default function AIProductCard({ product, onAdd, canAdd = false }) {
  const [quantity, setQuantity] = useState(1)
  const price = product.discountPrice || product.price
  const inStock = Number(product.stock || 0) > 0

  return (
    <article className="min-w-0 overflow-hidden rounded-xl border border-app-border bg-surface shadow-sm">
      <img
        src={product.image}
        alt={product.name}
        className="h-24 w-full object-cover"
        loading="lazy"
      />
      <div className="p-3">
        <p className="line-clamp-2 text-sm font-medium text-text-primary">{product.name}</p>
        <p className="mt-1 text-xs text-text-secondary">
          {product.unit || 'pcs'} · {inStock ? `${product.stock} in stock` : 'Out of stock'}
        </p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-sm font-bold text-brand-dark">{formatCurrency(price)}</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              className="grid h-10 w-10 place-items-center rounded-md border border-app-border text-sm"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="w-5 text-center text-xs font-semibold">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((value) => value + 1)}
              className="grid h-10 w-10 place-items-center rounded-md border border-app-border text-sm"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        </div>
        {canAdd ? (
          <button
            type="button"
            disabled={!inStock}
            onClick={() => onAdd?.(product, quantity)}
            className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-brand-primary text-xs font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={14} aria-hidden="true" />
            {inStock ? 'Add to cart' : 'Unavailable'}
          </button>
        ) : (
          <Link
            to={`/products/${encodeURIComponent(product.id)}`}
            className="mt-3 flex h-10 w-full items-center justify-center rounded-lg border border-brand-primary/30 text-xs font-semibold text-brand-dark transition hover:bg-brand-secondary"
          >
            View product
          </Link>
        )}
      </div>
    </article>
  )
}
