import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Check, MapPin, Truck } from 'lucide-react'
import Badge from '../../components/Badge.jsx'
import Breadcrumbs from '../../components/Breadcrumbs.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import OrderStatusBadge from '../../components/OrderStatusBadge.jsx'
import { SkeletonLine } from '../../components/Skeleton.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { getOrderTracking } from '../../services/commerce.service.js'

export default function OrderTrackingPage() {
  const { id } = useParams()
  const { status, data, error, refetch } = useAsync(
    () => getOrderTracking(id),
    [id],
  )
  const [liveOrder, setLiveOrder] = useState(null)

  useEffect(() => {
    if (data) setLiveOrder(data)
  }, [data])

  useEffect(() => {
    if (!id) return undefined
    const timer = setInterval(() => {
      getOrderTracking(id)
        .then((updated) => setLiveOrder(updated))
        .catch(() => {
          // Keep showing the last known status if a background refresh fails.
        })
    }, 15000)
    return () => clearInterval(timer)
  }, [id])

  const order = liveOrder || data

  if (status === 'loading') {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <SkeletonLine className="h-8 w-72" />
        <SkeletonLine className="mt-6 h-80 w-full rounded-2xl" />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <ErrorState message={error} onRetry={refetch} />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <EmptyState
          title="Order not found"
          description="We could not find this order or it does not belong to your account."
          actionLabel="View all orders"
          actionTo="/account/orders"
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Breadcrumbs
        items={[
          { label: 'Orders', to: '/account/orders' },
          { label: order.id, to: `/account/orders/${order.id}` },
          { label: 'Track' },
        ]}
      />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">Track your order</h1>
          <p className="mt-2 break-all text-sm text-text-secondary">Order {order.orderNumber || order.id}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="rounded-2xl border border-app-border bg-surface p-6">
          <h2 className="font-semibold text-text-primary">Delivery progress</h2>
          <ol className="mt-6 space-y-0">
            {order.timeline.map((step, index) => {
              const isLast = index === order.timeline.length - 1
              return (
                <li key={step.label} className="relative flex gap-4 pb-8 last:pb-0">
                  {!isLast && (
                    <span
                      className={`absolute left-[15px] top-8 h-full w-0.5 ${
                        step.complete ? 'bg-brand-primary' : 'bg-app-border'
                      }`}
                      aria-hidden="true"
                    />
                  )}
                  <span
                    className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 ${
                      step.complete
                        ? 'border-brand-primary bg-brand-primary text-white'
                        : 'border-app-border bg-surface text-text-secondary'
                    }`}
                  >
                    {step.complete ? (
                      <Check size={16} aria-hidden="true" />
                    ) : (
                      <Truck size={14} aria-hidden="true" />
                    )}
                  </span>
                  <div className="pt-1">
                    <p className={`text-sm font-semibold ${step.complete ? 'text-text-primary' : 'text-text-secondary'}`}>
                      {step.label}
                    </p>
                    <p className="mt-1 text-xs text-text-secondary">{step.date}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        </section>

        <div className="space-y-5">
          <section className="rounded-2xl border border-app-border bg-surface p-5">
            <h2 className="font-semibold text-text-primary">Delivery details</h2>
            <div className="mt-4 flex items-start gap-2 text-sm leading-6 text-text-secondary">
              <MapPin size={16} className="mt-1 shrink-0 text-brand-primary" aria-hidden="true" />
              <span className="min-w-0 break-words">
                {order.address.fullName}, {order.address.addressLine}, {order.address.city},
                {' '}{order.address.state} - {order.address.pincode}
              </span>
            </div>
            {order.deliveryDate && (
              <p className="mt-4 text-sm text-text-secondary">
                Date: <span className="font-medium text-text-primary">{order.deliveryDate}</span>
              </p>
            )}
            <p className="mt-2 text-sm text-text-secondary">
              Slot: <span className="font-medium text-text-primary">{order.deliverySlot}</span>
            </p>
          </section>

          <section className="rounded-2xl border border-brand-primary bg-brand-secondary/50 p-5">
            <Badge tone="brand">Live order status</Badge>
            <p className="mt-3 text-sm leading-6 text-brand-dark">
              This page refreshes automatically every 15 seconds. Status and
              payment updates come from the live order record. Live rider location
              is not available yet.
            </p>
          </section>

          <Link
            to={`/account/orders/${order.id}`}
            className="block rounded-xl border border-app-border bg-surface p-4 text-center text-sm font-semibold text-text-secondary hover:border-brand-primary hover:text-brand-primary"
          >
            View full order details
          </Link>
        </div>
      </div>
    </div>
  )
}
