import { CheckCircle2, PackageCheck } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import Button from '../../components/Button.jsx'
import PageHeader from '../../components/PageHeader.jsx'

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('order') || 'Order reference will appear here'

  return (
    <>
      <PageHeader title="Payment successful" breadcrumbs={[{ label: 'Payment', to: '/checkout' }, { label: 'Success' }]} />
      <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
        <div className="rounded-2xl border border-app-border bg-surface p-8 text-center shadow-sm">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-secondary text-brand-primary">
            <CheckCircle2 size={34} aria-hidden="true" />
          </span>
          <h1 className="mt-6 text-2xl font-bold text-text-primary">Thank you for your order</h1>
          <p className="mt-3 text-sm leading-6 text-text-secondary">
            This is the Phase 2 success-screen layout. Real payment confirmation,
            signature verification and order creation are implemented in Phase 5.
          </p>
          <div className="mt-6 rounded-xl bg-app-background p-4">
            <p className="text-xs text-text-secondary">Order reference</p>
            <p className="mt-1 font-semibold text-text-primary">{orderId}</p>
          </div>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button as={Link} to="/account/orders">View my orders</Button>
            <Button as={Link} to="/shop" variant="outline">Continue shopping</Button>
          </div>
          <p className="mt-6 inline-flex items-center gap-2 text-xs text-text-secondary">
            <PackageCheck size={15} aria-hidden="true" />
            No payment was collected from this demo screen.
          </p>
        </div>
      </div>
    </>
  )
}
