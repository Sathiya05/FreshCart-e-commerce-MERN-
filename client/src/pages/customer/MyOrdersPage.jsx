import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, RotateCcw } from 'lucide-react'
import Button from '../../components/Button.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import OrderStatusBadge from '../../components/OrderStatusBadge.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import { TableSkeleton } from '../../components/Skeleton.jsx'
import { formatCurrency } from '../../utils/format.js'
import { useAsync } from '../../hooks/useAsync.js'
import { getDemoOrders } from '../../services/account.service.js'

const filters = ['All orders', 'In progress', 'Delivered', 'Cancelled']

export default function MyOrdersPage() {
  const [activeFilter, setActiveFilter] = useState('All orders')
  const { status, data, error, refetch } = useAsync(getDemoOrders, [])

  const orders = (data || []).filter((order) => {
    if (activeFilter === 'In progress') return !['Delivered', 'Cancelled'].includes(order.status)
    if (activeFilter === 'Delivered') return order.status === 'Delivered'
    if (activeFilter === 'Cancelled') return order.status === 'Cancelled'
    return true
  })

  return (
    <>
      <PageHeader
        title="My orders"
        description="Review your previous and current demo orders."
        breadcrumbs={[{ label: 'Account', to: '/account/profile' }, { label: 'Orders' }]}
      />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`rounded-full border px-4 py-2 text-sm font-medium ${
                activeFilter === filter
                  ? 'border-brand-primary bg-brand-primary text-white'
                  : 'border-app-border bg-surface text-text-secondary hover:border-brand-primary'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {status === 'loading' && <TableSkeleton rows={4} columns={5} />}
        {status === 'error' && <ErrorState message={error} onRetry={refetch} />}
        {status === 'success' && orders.length === 0 && (
          <EmptyState
            icon={Package}
            title="No orders found"
            description="You do not have any orders matching this filter."
            actionLabel="Start shopping"
            actionTo="/shop"
          />
        )}
        {status === 'success' && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => (
              <article key={order.id} className="rounded-2xl border border-app-border bg-surface p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-app-border pb-4">
                  <div>
                    <p className="font-semibold text-text-primary">{order.id}</p>
                    <p className="mt-1 text-xs text-text-secondary">
                      Placed on {order.date} · {order.itemCount} items
                    </p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <div className="flex -space-x-2">
                    {order.items.map((item) => (
                      <img
                        key={item.productId}
                        src={item.image}
                        alt={item.name}
                        className="h-11 w-11 rounded-full border-2 border-surface object-cover"
                      />
                    ))}
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-xs text-text-secondary">Total</p>
                    <p className="font-bold text-text-primary">{formatCurrency(order.totalAmount)}</p>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button as={Link} to={`/account/orders/${order.id}`} size="sm">View details</Button>
                  <Button as={Link} to={`/account/orders/${order.id}/track`} size="sm" variant="outline">
                    <RotateCcw size={14} aria-hidden="true" />
                    Track order
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
