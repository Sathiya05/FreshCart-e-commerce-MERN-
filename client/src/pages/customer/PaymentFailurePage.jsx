import { AlertCircle, RotateCcw } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import Button from '../../components/Button.jsx'
import PageHeader from '../../components/PageHeader.jsx'

export default function PaymentFailurePage() {
  const [searchParams] = useSearchParams()
  const reason = searchParams.get('reason') || 'Payment could not be completed.'

  return (
    <>
      <PageHeader title="Payment failed" breadcrumbs={[{ label: 'Payment', to: '/checkout' }, { label: 'Failed' }]} />
      <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
        <div className="rounded-2xl border border-red-200 bg-surface p-8 text-center shadow-sm">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-red-50 text-red-600">
            <AlertCircle size={34} aria-hidden="true" />
          </span>
          <h1 className="mt-6 text-2xl font-bold text-text-primary">We could not complete the payment</h1>
          <p className="mt-3 text-sm leading-6 text-text-secondary">{reason}</p>
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            This screen is a Phase 2 layout only. Razorpay failure handling and
            retry logic are added in Phase 5.
          </div>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button as={Link} to="/checkout">
              <RotateCcw size={16} aria-hidden="true" />
              Back to checkout
            </Button>
            <Button as={Link} to="/contact" variant="outline">Contact support</Button>
          </div>
        </div>
      </div>
    </>
  )
}
