import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  AlertTriangle,
  BarChart3,
  ClipboardList,
  DollarSign,
  Package,
  ShoppingCart,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import AdminPageHeader from '../../components/AdminPageHeader.jsx'
import Badge from '../../components/Badge.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import OrderStatusBadge from '../../components/OrderStatusBadge.jsx'
import StatCard from '../../components/StatCard.jsx'
import { TableSkeleton } from '../../components/Skeleton.jsx'
import { formatCurrency, formatNumber } from '../../utils/format.js'
import { useAsync } from '../../hooks/useAsync.js'
import {
  getAdminDashboard,
  getAdminOrders,
} from '../../services/admin.service.js'

const pieColors = ['#16834A', '#F9C74F', '#105C36', '#8BC34A', '#CBD5C1']

export default function AdminDashboardPage() {
  const dashboard = useAsync(getAdminDashboard, [])
  const orders = useAsync(getAdminOrders, [])

  return (
    <>
      <AdminPageHeader
        title="Overview"
        description="A snapshot of your FreshCart store performance."
        actions={
          <Link to="/admin/reports" className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-primary px-4 text-sm font-semibold text-white hover:bg-brand-dark">
            <BarChart3 size={16} aria-hidden="true" />
            View reports
          </Link>
        }
      />

      {dashboard.isError && <ErrorState message={dashboard.error} onRetry={dashboard.refetch} />}

      {dashboard.isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-2xl bg-app-border/60" />
          ))}
        </div>
      )}

      {dashboard.status === 'success' && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard label="Total revenue" value={formatCurrency(dashboard.data.totalRevenue)} prefix="" icon={DollarSign} change={dashboard.data.revenueChange} />
            <StatCard label="Total orders" value={dashboard.data.totalOrders} icon={ShoppingCart} change={dashboard.data.ordersChange} tone="info" />
            <StatCard label="Total customers" value={dashboard.data.totalCustomers} icon={Users} change={dashboard.data.customersChange} />
            <StatCard label="Total products" value={dashboard.data.totalProducts} icon={Package} />
            <StatCard label="Low stock products" value={dashboard.data.lowStockProducts} icon={AlertTriangle} tone="warning" />
            <StatCard label="Pending orders" value={dashboard.data.pendingOrders} icon={ClipboardList} tone="info" />
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
            <section className="rounded-2xl border border-app-border bg-surface p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-text-primary">Revenue trend</h2>
                  <p className="mt-1 text-xs text-text-secondary">Monthly revenue in demo currency</p>
                </div>
                <Badge tone="success">+{dashboard.data.revenueChange}%</Badge>
              </div>
              <div className="mt-6 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dashboard.data.revenueSeries} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#16834A" stopOpacity={0.32} />
                        <stop offset="100%" stopColor="#16834A" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5EAE3" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#718071', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#718071', fontSize: 12 }} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Area type="monotone" dataKey="revenue" stroke="#16834A" strokeWidth={2.5} fill="url(#revenueFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="rounded-2xl border border-app-border bg-surface p-5 shadow-sm">
              <h2 className="font-semibold text-text-primary">Sales by category</h2>
              <p className="mt-1 text-xs text-text-secondary">Share of demo revenue</p>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dashboard.data.categorySales}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                    >
                      {dashboard.data.categorySales.map((entry, index) => (
                        <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip formatter={(value) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
            <section className="rounded-2xl border border-app-border bg-surface p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-text-primary">Recent orders</h2>
                <Link to="/admin/orders" className="text-sm font-semibold text-brand-primary hover:text-brand-dark">
                  View all
                </Link>
              </div>
              {orders.isLoading && <div className="mt-4"><TableSkeleton rows={4} columns={4} /></div>}
              {orders.isError && <div className="mt-4"><ErrorState message={orders.error} onRetry={orders.refetch} /></div>}
              {orders.status === 'success' && (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[520px] text-left text-sm">
                    <thead className="border-b border-app-border text-xs uppercase text-text-secondary">
                      <tr>
                        <th className="py-2">Order</th>
                        <th className="py-2">Date</th>
                        <th className="py-2">Status</th>
                        <th className="py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.data.slice(0, 5).map((order) => (
                        <tr key={order.id} className="border-b border-app-border last:border-0">
                          <td className="py-3 font-medium text-text-primary">{order.id}</td>
                          <td className="py-3 text-text-secondary">{order.date}</td>
                          <td className="py-3"><OrderStatusBadge status={order.status} /></td>
                          <td className="py-3 text-right font-semibold">{formatCurrency(order.totalAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-app-border bg-surface p-5 shadow-sm">
              <h2 className="font-semibold text-text-primary">Best-selling products</h2>
              <div className="mt-4 space-y-4">
                {dashboard.data.bestSellers.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-secondary text-xs font-bold text-brand-dark">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text-primary">{item.name}</p>
                      <p className="text-xs text-text-secondary">{formatNumber(item.units)} units sold</p>
                    </div>
                    <p className="text-sm font-semibold">{formatCurrency(item.revenue)}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      )}
    </>
  )
}
