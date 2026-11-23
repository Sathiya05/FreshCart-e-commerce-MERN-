import { BarChart3, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import AdminPageHeader from '../../components/AdminPageHeader.jsx'
import Button from '../../components/Button.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import { SkeletonLine } from '../../components/Skeleton.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { getAdminReports } from '../../services/admin.service.js'
import { formatCurrency, formatNumber } from '../../utils/format.js'

const shortDate = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value || '')
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

const longDate = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value || '')
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AdminSalesReportsPage() {
  const { status, data, error, refetch } = useAsync(getAdminReports, [])
  const maxRevenue = Math.max(1, ...(data?.revenueByDay || []).map((day) => day.revenue))

  return (
    <>
      <AdminPageHeader
        title="Sales reports"
        description="Revenue and order analytics calculated from live, paid orders."
        actions={
          <Button variant="outline" onClick={refetch}>
            <RefreshCw size={16} aria-hidden="true" />
            Refresh
          </Button>
        }
      />

      {status === 'loading' && <SkeletonLine className="h-96 w-full rounded-2xl" />}
      {status === 'error' && <ErrorState message={error} onRetry={refetch} />}

      {status === 'success' && data && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Total revenue', value: formatCurrency(data.revenue), icon: BarChart3 },
              { label: 'Revenue today', value: formatCurrency(data.todayRevenue) },
              { label: 'Paid orders', value: formatNumber(data.paidOrders) },
              { label: 'Average order value', value: formatCurrency(data.averageOrderValue) },
            ].map((card) => (
              <div key={card.label} className="rounded-2xl border border-app-border bg-surface p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">{card.label}</p>
                <p className="mt-2 text-2xl font-bold text-text-primary">{card.value}</p>
              </div>
            ))}
          </div>

          <section className="rounded-2xl border border-app-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-text-primary">Revenue — last 7 days</h2>
                <p className="mt-1 text-xs text-text-secondary">Only verified paid orders are counted.</p>
              </div>
              <span className="text-sm font-semibold text-brand-primary">
                {formatCurrency(data.weekRevenue)}
              </span>
            </div>
            <div className="mt-6 overflow-x-auto">
              <div className="flex h-52 min-w-[420px] items-end gap-2 sm:gap-4">
                {data.revenueByDay.map((day) => (
                  <div key={day.date} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                    <span className="block truncate text-[9px] font-medium text-text-secondary sm:text-[10px]" title={formatCurrency(day.revenue)}>
                      {formatCurrency(day.revenue)}
                    </span>
                    <div
                      className="w-full max-w-12 rounded-t-lg bg-brand-primary/80 transition-all"
                      style={{ height: `${Math.max(4, (day.revenue / maxRevenue) * 100)}%` }}
                      title={`${day.date}: ${formatCurrency(day.revenue)} from ${day.orders} orders`}
                    />
                    <span className="text-[10px] text-text-secondary">{shortDate(day.date)}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-app-border bg-surface p-5">
              <h2 className="font-semibold text-text-primary">Top products</h2>
              {data.topProducts.length === 0 ? (
                <p className="mt-5 text-sm text-text-secondary">No paid product sales recorded yet.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {data.topProducts.map((product) => (
                    <div key={product.name} className="flex items-center justify-between gap-4 border-b border-app-border pb-3 last:border-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-text-primary">{product.name}</p>
                        <p className="text-xs text-text-secondary">{formatNumber(product.units)} units sold</p>
                      </div>
                      <span className="shrink-0 whitespace-nowrap text-sm font-semibold">{formatCurrency(product.revenue)}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-app-border bg-surface p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-text-primary">Latest orders</h2>
                <Link to="/admin/orders" className="text-xs font-semibold text-brand-primary">View all</Link>
              </div>
              {data.recentOrders.length === 0 ? (
                <p className="mt-5 text-sm text-text-secondary">No orders have been placed yet.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {data.recentOrders.slice(0, 6).map((order) => (
                    <div key={order.id} className="flex items-center justify-between gap-4 border-b border-app-border pb-3 last:border-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-text-primary">{order.orderNumber}</p>
                        <p className="truncate text-xs text-text-secondary">{longDate(order.createdAt || order.date)}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="whitespace-nowrap text-sm font-semibold">{formatCurrency(order.totalAmount)}</p>
                        <p className="whitespace-nowrap text-xs text-text-secondary">{order.paymentStatus} · {order.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </>
  )
}
