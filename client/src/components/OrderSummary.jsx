import { CalendarDays, MapPin, ShieldCheck, Truck } from 'lucide-react'
import { formatCurrency } from '../utils/format.js'

export default function OrderSummary({
  subtotal = 0,
  discount = 0,
  deliveryCharge = 0,
  delivery = null,
  address = null,
  action,
  actionClassName = '',
  note,
  noteClassName = '',
}) {
  const total = Math.max(subtotal - discount, 0) + deliveryCharge

  return (
    <aside className="rounded-2xl border border-app-border bg-surface p-5 shadow-sm lg:sticky lg:top-24">
      <h2 className="text-lg font-semibold text-text-primary">Order summary</h2>
      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="min-w-0 text-text-secondary">Subtotal</dt>
          <dd className="shrink-0 text-right font-medium tabular-nums">{formatCurrency(subtotal)}</dd>
        </div>
        {discount > 0 && (
          <div className="flex justify-between gap-3 text-brand-primary">
            <dt className="min-w-0">Coupon discount</dt>
            <dd className="shrink-0 text-right font-semibold tabular-nums">− {formatCurrency(discount)}</dd>
          </div>
        )}
        <div className="flex justify-between gap-3">
          <dt className="min-w-0 text-text-secondary">Delivery</dt>
          <dd className="shrink-0 text-right font-medium tabular-nums">
            {deliveryCharge > 0 ? formatCurrency(deliveryCharge) : 'FREE'}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-app-border pt-4 text-base">
          <dt className="min-w-0 font-semibold">Total</dt>
          <dd className="shrink-0 text-right text-xl font-bold tabular-nums text-brand-dark">{formatCurrency(total)}</dd>
        </div>
      </dl>

      {(delivery?.date || delivery?.timeSlot || address) && (
        <div className="mt-5 min-w-0 space-y-2 rounded-xl border border-app-border bg-app-background p-3 text-xs text-text-secondary">
          <p className="font-semibold text-text-primary">Delivery confirmation</p>
          {delivery?.date && (
            <p className="flex min-w-0 items-center gap-2 break-words">
              <CalendarDays size={14} className="shrink-0" aria-hidden="true" />
              {delivery.dateLabel || delivery.date}
            </p>
          )}
          {delivery?.timeSlot && (
            <p className="flex min-w-0 items-center gap-2 break-words">
              <CalendarDays size={14} className="shrink-0" aria-hidden="true" />
              {delivery.timeSlot}
            </p>
          )}
          {delivery?.instructions && <p className="min-w-0 break-words">Instructions: {delivery.instructions}</p>}
          {address && (
            <p className="flex min-w-0 items-start gap-2">
              <MapPin size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span className="min-w-0 break-words">
                {[
                  address.fullName,
                  address.addressLine,
                  address.city,
                  address.state,
                  address.pincode,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </span>
            </p>
          )}
        </div>
      )}

      <div className="mt-5 flex items-start gap-2 rounded-xl bg-brand-secondary/60 p-3 text-xs text-brand-dark">
        <ShieldCheck size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
        <span>Prices are calculated from the live catalog at checkout.</span>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-text-secondary">
        <Truck size={15} aria-hidden="true" />
        Free delivery on orders above ₹499.
      </div>

      {action && <div className={`mt-5 ${actionClassName}`}>{action}</div>}
      {note && (
        <p className={`mt-4 text-center text-xs text-text-secondary ${noteClassName}`}>{note}</p>
      )}
    </aside>
  )
}
