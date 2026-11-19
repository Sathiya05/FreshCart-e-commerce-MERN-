import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  CircleDashed,
  Package,
  Tags,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import AdminPageHeader from '../../components/AdminPageHeader.jsx'
import Badge from '../../components/Badge.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import StatCard from '../../components/StatCard.jsx'
import { TableSkeleton } from '../../components/Skeleton.jsx'
import { formatCurrency } from '../../utils/format.js'
import { useAsync } from '../../hooks/useAsync.js'
import { getAdminOverview, getAdminProducts } from '../../services/admin.service.js'

export default function AdminDashboardPage() {
  const overview = useAsync(getAdminOverview, [])
  const products = useAsync(getAdminProducts, [])

  return (
    <>
      <AdminPageHeader
        title="Overview"
        description="Live counts from your FreshCart database."
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
            <StatCard label="Total products" value={overview.data.products} icon={Package} />
            <StatCard label="Active products" value={overview.data.activeProducts} icon={CheckCircle2} tone="info" />
            <StatCard label="Categories" value={overview.data.categories} icon={Tags} />
            <StatCard label="Customers" value={overview.data.customers} icon={Users} />
            <StatCard label="Low stock" value={overview.data.lowStock} icon={AlertTriangle} tone="warning" />
            <StatCard label="Out of stock" value={overview.data.outOfStock} icon={CircleDashed} tone="warning" />
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
              <h2 className="flex items-center gap-2 font-semibold text-text-primary">
                <Boxes size={18} className="text-brand-primary" aria-hidden="true" />
                What is live
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-text-secondary">
                <li>✓ Secure customer registration and login</li>
                <li>✓ Public product and category browsing</li>
                <li>✓ Admin product and category management</li>
                <li>✓ Real MongoDB stock and customer counts</li>
              </ul>
              <p className="mt-5 rounded-xl bg-app-background p-4 text-xs leading-5 text-text-secondary">
                Revenue, orders and sales charts will appear when the commerce and payment APIs
                are added. No placeholder figures are shown here.
              </p>
            </section>
          </div>
        </>
      )}
    </>
  )
}
