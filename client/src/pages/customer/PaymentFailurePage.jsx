import { AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import Button from '../../components/Button.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import { SkeletonLine } from '../../components/Skeleton.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { getOrderById } from '../../services/commerce.service.js'

export default function PaymentFailurePage() {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('order')
  const reason = searchParams.get('reason') || 'Payment could not be completed.'
  const { status, data: order, error, refetch } = useAsync(
    () =>
      orderId
        ? getOrderById(orderId)
        : Promise.reject(new Error('No order reference was provided.')),
    [orderId],
  )

  if (status === 'loading') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
        <SkeletonLine className="h-72 w-full rounded-2xl" />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <>
        <PageHeader title="Payment status" breadcrumbs={[{ label: 'Payment' }]} />
        <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
          <ErrorState message={error} onRetry={refetch} />
        </div>
      </>
    )
  }

  const paid = order?.paymentStatus === 'Paid'

  return (
    <>
      <PageHeader
        title={paid ? 'Payment confirmed' : 'Payment failed'}
        breadcrumbs={[{ label: 'Checkout', to: '/checkout' }, { label: 'Payment' }]}
      />
      <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
        <div
          className={`rounded-2xl border bg-surface p-8 text-center shadow-sm ${
            paid ? 'border-app-border' : 'border-red-200'
          }`}
        >
          <span
            className={`mx-auto grid h-16 w-16 place-items-center rounded-full ${
              paid ? 'bg-brand-secondary text-brand-primary' : 'bg-red-50 text-red-600'
            }`}
          >
            {paid ? <CheckCircle2 size={34} aria-hidden="true" /> : <AlertCircle size={34} aria-hidden="true" />}
          </span>

          <h1 className="mt-6 text-2xl font-bold text-text-primary">
            {paid ? 'Your payment went through' : 'We could not complete the payment'}
          </h1>
          <p className="mt-3 text-sm leading-6 text-text-secondary">
            {paid
              ? 'The server has verified this payment. Your order is confirmed.'
              : reason}
          </p>

          {!paid && order?.paymentFailureReason && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              {order.paymentFailureReason}
            </div>
          )}

          <div className="mt-6 rounded-xl bg-app-background p-4">
            <p className="text-xs text-text-secondary">Order reference</p>
            <p className="mt-1 font-semibold text-text-primary">
              {order?.orderNumber || order?.id || '—'}
            </p>
            <p className="mt-2 text-xs text-text-secondary">
              Server payment status: <span className="font-medium">{order?.paymentStatus}</span>
            </p>
          </div>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {paid ? (
              <Button as={Link} to={`/payment/success?order=${order.id}`}>
                View confirmation
              </Button>
            ) : (
              <Button as={Link} to={`/account/orders/${order.id}`}>
                <RotateCcw size={16} aria-hidden="true" />
                Review and retry payment
              </Button>
            )}
            <Button as={Link} to="/account/orders" variant="outline">
              View my orders
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
