import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  CreditCard,
  Package,
  RefreshCw,
  ShoppingCart,
  Tags,
  Users,
  Wallet,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import AdminPageHeader from '../../components/AdminPageHeader.jsx'
import Badge from '../../components/Badge.jsx'
import Button from '../../components/Button.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import StatCard from '../../components/StatCard.jsx'
import { TableSkeleton } from '../../components/Skeleton.jsx'
import { formatCurrency } from '../../utils/format.js'
import { useAsync } from '../../hooks/useAsync.js'
import { useAppDispatch } from '../../redux/hooks.js'
import { pushToast } from '../../redux/uiSlice.js'
import {
  getAdminOverview,
  getAdminProducts,
  syncAdminPayments,
} from '../../services/admin.service.js'

export default function AdminDashboardPage() {
  const dispatch = useAppDispatch()
  const overview = useAsync(getAdminOverview, [])
  const products = useAsync(getAdminProducts, [])
  const [liveOverview, setLiveOverview] = useState(overview.data)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    if (overview.data) setLiveOverview(overview.data)
  }, [overview.data])

  useEffect(() => {
    const timer = setInterval(() => {
      getAdminOverview()
        .then((updated) => setLiveOverview(updated))
        .catch(() => {
          // Keep the last known numbers if a background refresh fails.
        })
    }, 20000)
    return () => clearInterval(timer)
  }, [])

  const syncPayments = async () => {
    setSyncing(true)
    try {
      const result = await syncAdminPayments()
      overview.refetch()
      dispatch(pushToast({
        title: 'Payment sync complete',
        message: `${result.updated || 0} order(s) updated from Razorpay.`,
      }))
    } catch (error) {
      dispatch(pushToast({
        type: 'error',
        title: 'Sync failed',
        message: error?.message || 'Could not sync payments right now.',
      }))
    } finally {
      setSyncing(false)
    }
  }

  const summary = liveOverview || overview.data

  return (
    <>
      <AdminPageHeader
        title="Overview"
        description="Live counts, orders and revenue from your FreshCart database."
        actions={
          <Button variant="outline" onClick={syncPayments} disabled={syncing}>
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} aria-hidden="true" />
            {syncing ? 'Syncing…' : 'Sync payments'}
          </Button>
        }
      />

      {overview.isError && <ErrorState message={overview.error} onRetry={overview.refetch} />}

      {overview.isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-2xl bg-app-border/60" />
          ))}
        </div>
      )}

      {overview.status === 'success' && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard label="Revenue (paid)" value={formatCurrency(summary?.revenue)} icon={Wallet} tone="info" />
            <StatCard label="Total orders" value={summary?.orders || 0} icon={ShoppingCart} />
            <StatCard label="Paid orders" value={summary?.paidOrders || 0} icon={CheckCircle2} tone="info" />
            <StatCard label="Awaiting payment" value={summary?.pendingPayment || 0} icon={CreditCard} tone="warning" />
            <StatCard label="Customers" value={summary?.customers || 0} icon={Users} />
            <StatCard label="Products" value={summary?.products || 0} icon={Package} />
            <StatCard label="Categories" value={summary?.categories || 0} icon={Tags} />
            <StatCard label="Low stock" value={summary?.lowStock || 0} icon={AlertTriangle} tone="warning" />
            <StatCard label="Out of stock" value={summary?.outOfStock || 0} icon={CircleDashed} tone="warning" />
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
            <section className="rounded-2xl border border-app-border bg-surface p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-text-primary">Recent products</h2>
                  <p className="mt-1 text-xs text-text-secondary">Latest items in the catalog</p>
                </div>
                <Link to="/admin/products" className="text-sm font-semibold text-brand-primary hover:text-brand-dark">
                  Manage products
                </Link>
              </div>

              {products.isLoading && <div className="mt-4"><TableSkeleton rows={5} columns={4} /></div>}
              {products.isError && <div className="mt-4"><ErrorState message={products.error} onRetry={products.refetch} /></div>}
              {products.status === 'success' && (
                products.data.items.length === 0 ? (
                  <p className="py-6 text-center text-sm text-text-secondary">
                    No products yet. Add one from the Products page.
                  </p>
                ) : (
                  <>
                    <div className="mt-4 space-y-3 sm:hidden">
                      {products.data.items.slice(0, 5).map((product) => (
                        <div key={product.id} className="rounded-xl border border-app-border p-4">
                          <p className="font-medium text-text-primary">{product.name}</p>
                          <p className="mt-1 text-xs text-text-secondary">{product.categoryName}</p>
                          <div className="mt-3 flex items-center justify-between gap-3">
                            <Badge tone={product.stock === 0 ? 'danger' : product.stock <= 20 ? 'warning' : 'success'}>
                              {product.stock} units
                            </Badge>
                            <span className="font-semibold">
                              {formatCurrency(product.discountPrice || product.price)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 hidden overflow-x-auto sm:block">
                      <table className="w-full min-w-[520px] text-left text-sm">
                        <thead className="border-b border-app-border text-xs uppercase text-text-secondary">
                          <tr>
                            <th className="py-2">Product</th>
                            <th className="py-2">Category</th>
                            <th className="py-2">Stock</th>
                            <th className="py-2 text-right">Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {products.data.items.slice(0, 5).map((product) => (
                            <tr key={product.id} className="border-b border-app-border last:border-0">
                              <td className="py-3 font-medium text-text-primary">{product.name}</td>
                              <td className="py-3 text-text-secondary">{product.categoryName}</td>
                              <td className="py-3">
                                <Badge tone={product.stock === 0 ? 'danger' : product.stock <= 20 ? 'warning' : 'success'}>
                                  {product.stock} units
                                </Badge>
                              </td>
                              <td className="py-3 text-right font-semibold">
                                {formatCurrency(product.discountPrice || product.price)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )
              )}
            </section>

            <section className="rounded-2xl border border-app-border bg-surface p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-semibold text-text-primary">
                  <ShoppingCart size={18} className="text-brand-primary" aria-hidden="true" />
                  Recent orders
                </h2>
                <Link to="/admin/orders" className="text-xs font-semibold text-brand-primary">
                  View all
                </Link>
              </div>
              {(summary?.recentOrders || []).length === 0 ? (
                <p className="mt-6 text-sm text-text-secondary">No orders have been placed yet.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {summary.recentOrders.map((order) => (
                    <div key={order.id} className="rounded-xl border border-app-border p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-text-primary">{order.orderNumber}</p>
                        <Badge tone={order.paymentStatus === 'Paid' ? 'success' : 'warning'}>
                          {order.paymentStatus}
                        </Badge>
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-3 text-xs text-text-secondary">
                        <span>{order.customer?.name || order.address?.fullName || 'Customer'}</span>
                        <span className="font-medium text-text-primary">{formatCurrency(order.totalAmount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-5 rounded-xl bg-app-background p-4 text-xs leading-5 text-text-secondary">
                This overview refreshes automatically. Use “Sync payments” if Razorpay captured
                a payment but its webhook did not arrive.
              </p>
            </section>
          </div>
        </>
      )}
    </>
  )
}
