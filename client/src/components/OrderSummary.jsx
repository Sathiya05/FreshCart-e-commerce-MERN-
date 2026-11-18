import { ShieldCheck, Truck } from 'lucide-react'
import { formatCurrency } from '../utils/format.js'

export default function OrderSummary({
  subtotal = 0,
  discount = 0,
  deliveryCharge = 0,
  action,
  note,
}) {
  const total = Math.max(subtotal - discount, 0) + deliveryCharge

  return (
    <aside className="rounded-2xl border border-app-border bg-surface p-5 shadow-sm lg:sticky lg:top-24">
      <h2 className="text-lg font-semibold text-text-primary">Order summary</h2>
      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-text-secondary">Subtotal</dt>
          <dd className="font-medium">{formatCurrency(subtotal)}</dd>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-brand-primary">
            <dt>Coupon discount</dt>
            <dd className="font-semibold">− {formatCurrency(discount)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-text-secondary">Delivery</dt>
          <dd className="font-medium">
            {deliveryCharge > 0 ? formatCurrency(deliveryCharge) : 'FREE'}
          </dd>
        </div>
        <div className="flex items-center justify-between border-t border-app-border pt-4 text-base">
          <dt className="font-semibold">Total</dt>
          <dd className="text-xl font-bold text-brand-dark">{formatCurrency(total)}</dd>
        </div>
      </dl>

      <div className="mt-5 flex items-start gap-2 rounded-xl bg-brand-secondary/60 p-3 text-xs text-brand-dark">
        <ShieldCheck size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
        <span>Prices shown are demo prices. Final totals will be calculated on the backend.</span>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-text-secondary">
        <Truck size={15} aria-hidden="true" />
        Free delivery on orders above ₹499 in Phase 4.
      </div>

      {action && <div className="mt-5">{action}</div>}
      {note && <p className="mt-4 text-center text-xs text-text-secondary">{note}</p>}
    </aside>
  )
}
