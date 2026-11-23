import { AlertCircle, CheckCircle2, PackageCheck } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import Button from '../../components/Button.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import { SkeletonLine } from '../../components/Skeleton.jsx'
import { formatCurrency } from '../../utils/format.js'
import { useAsync } from '../../hooks/useAsync.js'
import { getOrderById } from '../../services/commerce.service.js'

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('order')
  const { status, data: order, error, refetch } = useAsync(
    () =>
      orderId
        ? getOrderById(orderId)
        : Promise.reject(new Error('No order reference was provided.')),
    [orderId],
  )

  if (status === 'loading') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        <SkeletonLine className="h-80 w-full rounded-2xl" />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <>
        <PageHeader title="Payment confirmation" breadcrumbs={[{ label: 'Payment' }]} />
        <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
          <ErrorState message={error} onRetry={refetch} />
        </div>
      </>
    )
  }

  const paid = order?.paymentStatus === 'Paid'

  return (
    <>
      <PageHeader
        title={paid ? 'Payment successful' : 'Payment confirmation'}
        breadcrumbs={[{ label: 'Checkout', to: '/checkout' }, { label: 'Payment' }]}
      />
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        <div
          className={`rounded-2xl border bg-surface p-5 text-center shadow-sm sm:p-8 ${
            paid ? 'border-app-border' : 'border-amber-200'
          }`}
        >
          <span
            className={`mx-auto grid h-16 w-16 place-items-center rounded-full ${
              paid ? 'bg-brand-secondary text-brand-primary' : 'bg-amber-50 text-amber-600'
            }`}
          >
            {paid ? <CheckCircle2 size={34} aria-hidden="true" /> : <AlertCircle size={34} aria-hidden="true" />}
          </span>

          <h1 className="mt-6 text-2xl font-bold text-text-primary">
            {paid ? 'Thank you for your order' : 'We are still confirming payment'}
          </h1>
          <p className="mt-3 text-sm leading-6 text-text-secondary">
            {paid
              ? 'Your online payment was verified and the order is confirmed.'
              : 'This page only shows success once FreshCart has verified the payment. Check the order status below.'}
          </p>

          <div className="mt-6 min-w-0 rounded-xl bg-app-background p-4 text-left">
            <div className="flex min-w-0 justify-between gap-3 sm:gap-4">
              <span className="shrink-0 text-xs text-text-secondary">Order</span>
              <span className="min-w-0 break-all text-right font-semibold text-text-primary">
                {order?.orderNumber || order?.id || '—'}
              </span>
            </div>
            <div className="mt-2 flex min-w-0 justify-between gap-3 sm:gap-4">
              <span className="shrink-0 text-xs text-text-secondary">Payment status</span>
              <span className="min-w-0 break-words text-right font-medium text-text-primary">{order?.paymentStatus}</span>
            </div>
            {paid && (
              <div className="mt-2 flex min-w-0 justify-between gap-3 sm:gap-4">
                <span className="shrink-0 text-xs text-text-secondary">Amount paid</span>
                <span className="min-w-0 shrink-0 text-right font-semibold text-text-primary">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
            )}
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center sm:[&>*]:w-auto [&>*]:w-full">
            <Button as={Link} to={`/account/orders/${order.id}`}>
              View order details
            </Button>
            <Button as={Link} to="/account/orders" variant="outline">
              View my orders
            </Button>
            {!paid && (
              <Button variant="ghost" onClick={refetch}>
                Refresh status
              </Button>
            )}
          </div>

          <p className="mt-6 inline-flex items-center gap-2 text-xs text-text-secondary">
            <PackageCheck size={15} aria-hidden="true" />
            {paid
              ? 'Payment was verified with a signed Razorpay response.'
              : 'No success is shown until the server records a verified payment.'}
          </p>
        </div>
      </div>
    </>
  )
}
