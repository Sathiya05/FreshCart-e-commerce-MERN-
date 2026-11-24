import { CheckCircle2, Clock3, MapPin, PackageCheck, Truck } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import Button from '../../components/Button.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import { SkeletonLine } from '../../components/Skeleton.jsx'
import { formatCurrency } from '../../utils/format.js'
import { useAsync } from '../../hooks/useAsync.js'
import { getOrderById } from '../../services/commerce.service.js'

export default function OrderConfirmationPage() {
  const { id } = useParams()
  const { status, data: order, error, refetch } = useAsync(
    () => getOrderById(id),
    [id],
  )

  if (status === 'loading') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <SkeletonLine className="h-96 w-full rounded-2xl" />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <ErrorState message={error} onRetry={refetch} />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <EmptyState
          title="Order not found"
          description="This order does not exist or does not belong to your account."
          actionLabel="View all orders"
          actionTo="/account/orders"
        />
      </div>
    )
  }

  const paid = order.paymentStatus === 'Paid'

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <section className="overflow-hidden rounded-2xl border border-app-border bg-surface shadow-sm">
        <div className="border-b border-app-border bg-brand-secondary/40 px-5 py-8 text-center sm:px-8">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-primary text-white">
            <CheckCircle2 size={34} aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
            Your order has been placed!
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-text-secondary">
            {paid
              ? 'Your payment is confirmed. We are getting your fresh groceries ready.'
              : 'We have received your order. You can track it any time from your orders.'}
          </p>
          <p className="mt-4 break-all text-sm font-semibold text-brand-dark">
            Order {order.orderNumber || order.id}
          </p>
        </div>

        <div className="space-y-5 p-5 sm:p-8">
          <div className="grid gap-3 rounded-xl bg-app-background p-4 text-sm sm:grid-cols-3">
            <div className="min-w-0">
              <p className="text-xs text-text-secondary">Placed on</p>
              <p className="mt-1 font-medium text-text-primary">{order.date}</p>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-text-secondary">Payment</p>
              <p className="mt-1 font-medium text-text-primary">{order.paymentStatus}</p>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-text-secondary">Total paid</p>
              <p className="mt-1 font-semibold text-text-primary">
                {formatCurrency(order.totalAmount)}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-app-border p-4">
            <h2 className="flex items-center gap-2 font-semibold text-text-primary">
              <Truck size={17} className="text-brand-primary" aria-hidden="true" />
              Delivery details
            </h2>
            <p className="mt-3 flex items-start gap-2 text-sm text-text-secondary">
              <Clock3 size={16} className="mt-0.5 shrink-0 text-brand-primary" aria-hidden="true" />
              <span className="min-w-0">
                {order.deliveryDate ? `${order.deliveryDate} · ` : ''}
                <span className="font-medium text-text-primary">
                  {order.deliverySlot || 'Slot to be confirmed'}
                </span>
              </span>
            </p>
            {order.address && (
              <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-text-secondary">
                <MapPin size={16} className="mt-1 shrink-0 text-brand-primary" aria-hidden="true" />
                <span className="min-w-0 break-words">
                  {order.address.fullName}, {order.address.addressLine}, {order.address.city},
                  {' '}{order.address.state} - {order.address.pincode}
                </span>
              </p>
            )}
          </div>

          <div className="rounded-xl border border-app-border p-4">
            <h2 className="flex items-center gap-2 font-semibold text-text-primary">
              <PackageCheck size={17} className="text-brand-primary" aria-hidden="true" />
              Items in this order
            </h2>
            <ul className="mt-4 space-y-4">
              {order.items.map((item) => (
                <li key={item.productId || item.id} className="flex min-w-0 gap-3 border-b border-app-border pb-4 last:border-0 last:pb-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-14 w-14 shrink-0 rounded-xl border border-app-border object-cover sm:h-16 sm:w-16"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-medium text-text-primary">{item.name}</p>
                    <p className="mt-1 text-xs text-text-secondary">
                      {item.unit} · Qty {item.quantity}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-text-primary">
                    {formatCurrency(item.lineTotal || item.price * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:[&>*]:w-auto [&>*]:w-full">
            <Button as={Link} to={`/account/orders/${order.id}/track`}>
              <Truck size={17} aria-hidden="true" />
              Track this order
            </Button>
            <Button as={Link} to={`/account/orders/${order.id}`} variant="outline">
              View order details
            </Button>
            <Button as={Link} to="/account/orders" variant="ghost">
              View all orders
            </Button>
          </div>
        </div>
      </section>

      <p className="mt-6 text-center text-xs text-text-secondary">
        A confirmation for this order is saved in your account. Continue shopping any time.
      </p>
    </div>
  )
}
