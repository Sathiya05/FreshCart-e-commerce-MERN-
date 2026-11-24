import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, Truck } from 'lucide-react'
import Button from '../../components/Button.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import OrderStatusBadge from '../../components/OrderStatusBadge.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import { TableSkeleton } from '../../components/Skeleton.jsx'
import { formatCurrency } from '../../utils/format.js'
import { useAsync } from '../../hooks/useAsync.js'
import { getOrders } from '../../services/commerce.service.js'

const filters = ['All orders', 'In progress', 'Delivered', 'Cancelled']

export default function MyOrdersPage() {
  const [activeFilter, setActiveFilter] = useState('All orders')
  const { status, data, error, refetch } = useAsync(
    () => getOrders({ limit: 60 }),
    [],
  )

  const orders = (data?.items || []).filter((order) => {
    if (activeFilter === 'In progress') return !['Delivered', 'Cancelled'].includes(order.status)
    if (activeFilter === 'Delivered') return order.status === 'Delivered'
    if (activeFilter === 'Cancelled') return order.status === 'Cancelled'
    return true
  })

  return (
    <>
      <PageHeader
        title="My orders"
        description="Review your previous and current orders."
        breadcrumbs={[{ label: 'Account', to: '/account/profile' }, { label: 'Orders' }]}
      />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`rounded-full border px-4 py-2.5 text-sm font-medium ${
                activeFilter === filter
                  ? 'border-brand-primary bg-brand-primary text-white'
                  : 'border-app-border bg-surface text-text-secondary hover:border-brand-primary'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {status === 'loading' && <TableSkeleton rows={4} columns={5} columnsClass="grid-cols-1 sm:grid-cols-3 lg:grid-cols-5" />}
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
                  <div className="min-w-0">
                    <p className="break-all font-semibold text-text-primary">{order.orderNumber || order.id}</p>
                    <p className="mt-1 text-xs text-text-secondary">
                      Placed on {order.date} · {order.itemCount} items
                    </p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>

                <ul className="mt-4 divide-y divide-app-border">
                  {order.items.map((item) => (
                    <li key={item.productId || item.id} className="flex min-w-0 gap-3 py-3 first:pt-0 last:pb-0">
                      <Link to={`/products/${item.productId || item.id}`} className="shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-16 w-16 rounded-xl border border-app-border object-cover"
                        />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/products/${item.productId || item.id}`}
                          className="block break-words text-sm font-medium text-text-primary hover:text-brand-primary"
                        >
                          {item.name}
                        </Link>
                        <p className="mt-1 text-xs text-text-secondary">
                          {item.unit} · Qty {item.quantity}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-text-primary">
                          {formatCurrency(item.lineTotal || item.price * item.quantity)}
                        </p>
                        {item.quantity > 1 && (
                          <p className="mt-1 text-xs text-text-secondary">
                            {formatCurrency(item.price)} each
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-app-border pt-4">
                  <p className="flex min-w-0 items-center gap-2 text-xs text-text-secondary">
                    <Truck size={15} className="shrink-0 text-brand-primary" aria-hidden="true" />
                    <span className="min-w-0">
                      {order.deliveryDate ? `${order.deliveryDate} · ` : ''}
                      {order.deliverySlot || 'Delivery slot to be confirmed'}
                    </span>
                  </p>
                  <p className="shrink-0 text-sm font-bold text-text-primary">
                    Total {formatCurrency(order.totalAmount)}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button as={Link} to={`/account/orders/${order.id}/track`} size="sm" className="h-11 sm:h-9">
                    <Truck size={14} aria-hidden="true" />
                    Track order
                  </Button>
                  <Button as={Link} to={`/account/orders/${order.id}`} size="sm" variant="outline" className="h-11 sm:h-9">
                    View details
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
