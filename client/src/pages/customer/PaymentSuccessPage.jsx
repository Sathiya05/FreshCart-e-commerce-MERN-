import { Navigate, useSearchParams } from 'react-router-dom'
import EmptyState from '../../components/EmptyState.jsx'

/**
 * Older payment links use /payment/success?order=<id>. The confirmation screen
 * is now shared by online payments and cash-on-delivery orders.
 */
export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('order')

  if (!orderId) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <EmptyState
          title="No order reference"
          description="Open this link from your order confirmation or view your orders instead."
          actionLabel="View my orders"
          actionTo="/account/orders"
        />
      </div>
    )
  }

  return <Navigate to={`/order-confirmation/${encodeURIComponent(orderId)}`} replace />
}
