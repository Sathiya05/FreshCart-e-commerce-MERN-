import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CreditCard, MapPin, Truck } from 'lucide-react'
import Badge from '../../components/Badge.jsx'
import Breadcrumbs from '../../components/Breadcrumbs.jsx'
import Button from '../../components/Button.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import OrderStatusBadge from '../../components/OrderStatusBadge.jsx'
import { SkeletonLine } from '../../components/Skeleton.jsx'
import { useAppDispatch } from '../../redux/hooks.js'
import { pushToast } from '../../redux/uiSlice.js'
import { formatCurrency } from '../../utils/format.js'
import { useAsync } from '../../hooks/useAsync.js'
import useRazorpayCheckout from '../../hooks/useRazorpayCheckout.js'
import { getOrderById, retryPayment } from '../../services/commerce.service.js'

export default function OrderDetailsPage() {
  const { id } = useParams()
  const dispatch = useAppDispatch()
  const pay = useRazorpayCheckout()
  const [paying, setPaying] = useState(false)
  const { status, data: order, error, refetch } = useAsync(
    () => getOrderById(id),
    [id],
  )

  if (status === 'loading') {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <SkeletonLine className="h-8 w-64" />
        <SkeletonLine className="mt-6 h-96 w-full rounded-2xl" />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <ErrorState message={error} onRetry={refetch} />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <EmptyState
          title="Order not found"
          description="This order reference does not exist or does not belong to your account."
          actionLabel="View all orders"
          actionTo="/account/orders"
        />
      </div>
    )
  }

  const canPayOnline =
    order.paymentMethodValue === 'razorpay' &&
    ['Pending', 'Failed'].includes(order.paymentStatus) &&
    order.status !== 'Cancelled'

  const handlePayNow = async () => {
    setPaying(true)
    try {
      const payment = await retryPayment(order.id)
      await pay(payment)
    } catch (apiError) {
      dispatch(
        pushToast({
          type: 'error',
          title: 'Could not start payment',
          message: apiError?.message || 'Please try again.',
        }),
      )
    } finally {
      setPaying(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Breadcrumbs
        items={[
          { label: 'Account', to: '/account/profile' },
          { label: 'Orders', to: '/account/orders' },
          { label: order.orderNumber || order.id },
        ]}
      />

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">Order {order.orderNumber || order.id}</h1>
          <p className="mt-2 text-sm text-text-secondary">Placed on {order.date}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <OrderStatusBadge status={order.status} />
          <Badge
            tone={
              order.paymentStatus === 'Paid'
                ? 'success'
                : order.paymentStatus === 'Failed'
                  ? 'danger'
                  : 'warning'
            }
          >
            {order.paymentStatus}
          </Badge>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-app-border bg-surface p-5">
            <h2 className="font-semibold text-text-primary">Items</h2>
            <div className="mt-4 space-y-4">
              {order.items.map((item) => (
                <div key={item.productId} className="flex gap-3 border-b border-app-border pb-4 last:border-0 last:pb-0">
                  <img src={item.image} alt={item.name} className="h-16 w-16 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-text-primary">{item.name}</p>
                    <p className="text-xs text-text-secondary">{item.unit} · Qty {item.quantity}</p>
                  </div>
                  <p className="font-semibold">{formatCurrency(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-app-border bg-surface p-5">
            <h2 className="flex items-center gap-2 font-semibold text-text-primary">
              <Truck size={17} className="text-brand-primary" aria-hidden="true" />
              Delivery
            </h2>
            {order.deliveryDate && (
              <p className="mt-3 text-sm text-text-secondary">
                Date: <span className="font-medium text-text-primary">{order.deliveryDate}</span>
              </p>
            )}
            <p className="mt-2 text-sm text-text-secondary">
              Slot: <span className="font-medium text-text-primary">{order.deliverySlot || 'Not selected'}</span>
            </p>
            {order.deliveryInstructions && (
              <p className="mt-2 text-sm text-text-secondary">
                Instructions: <span className="font-medium text-text-primary">{order.deliveryInstructions}</span>
              </p>
            )}
            <div className="mt-4 flex items-start gap-2 text-sm leading-6 text-text-secondary">
              <MapPin size={16} className="mt-1 shrink-0 text-brand-primary" aria-hidden="true" />
              <span>
                {order.address.fullName}, {order.address.addressLine}, {order.address.city},
                {' '}{order.address.state} - {order.address.pincode}
              </span>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-app-border bg-surface p-5">
            <h2 className="font-semibold text-text-primary">Payment</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-text-secondary">Method</dt>
                <dd className="inline-flex items-center gap-1.5 font-medium">
                  <CreditCard size={14} aria-hidden="true" />
                  {order.paymentMethod}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-secondary">Status</dt>
                <dd className="font-medium">{order.paymentStatus}</dd>
              </div>
              <div className="flex justify-between border-t border-app-border pt-3 text-base">
                <dt className="font-semibold">Total</dt>
                <dd className="font-bold text-brand-dark">{formatCurrency(order.totalAmount)}</dd>
              </div>
            </dl>
            {order.razorpayPaymentId && (
              <p className="mt-3 break-all text-xs text-text-secondary">
                Payment ID: {order.razorpayPaymentId}
              </p>
            )}
            {canPayOnline && (
              <Button className="mt-5 w-full" onClick={handlePayNow} disabled={paying}>
                <CreditCard size={16} aria-hidden="true" />
                {paying ? 'Opening payment…' : 'Pay now'}
              </Button>
            )}
            {order.paymentFailureReason && (
              <p className="mt-3 text-xs text-red-600">{order.paymentFailureReason}</p>
            )}
          </section>

          <Link
            to={`/account/orders/${order.id}/track`}
            className="block rounded-2xl border border-brand-primary bg-brand-secondary/50 p-5 text-center text-sm font-semibold text-brand-dark hover:bg-brand-secondary"
          >
            Track this order
          </Link>
        </div>
      </div>
    </div>
  )
}
