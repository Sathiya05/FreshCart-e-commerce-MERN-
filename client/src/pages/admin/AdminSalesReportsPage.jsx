import {
  Bar,
  BarChart,
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
import { Download, TrendingUp } from 'lucide-react'
import AdminPageHeader from '../../components/AdminPageHeader.jsx'
import Button from '../../components/Button.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import { SkeletonLine } from '../../components/Skeleton.jsx'
import { useAppDispatch } from '../../redux/hooks.js'
import { pushToast } from '../../redux/uiSlice.js'
import { formatCurrency, formatNumber } from '../../utils/format.js'
import { useAsync } from '../../hooks/useAsync.js'
import { getSalesReport } from '../../services/admin.service.js'

const pieColors = ['#16834A', '#F9C74F', '#105C36', '#8BC34A', '#CBD5C1']

export default function AdminSalesReportsPage() {
  const dispatch = useAppDispatch()
  const { status, data, error, refetch } = useAsync(getSalesReport, [])

  return (
    <>
      <AdminPageHeader
        title="Sales reports"
        description="Revenue and product performance across the demo catalog."
        actions={
          <Button
            variant="outline"
            onClick={() =>
              dispatch(
                pushToast({
                  type: 'info',
                  message: 'CSV export is added with the real reporting API in Phase 3.',
                }),
              )
            }
          >
            <Download size={16} aria-hidden="true" />
            Export CSV
          </Button>
        }
      />

      {status === 'loading' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <SkeletonLine key={index} className="h-28 rounded-2xl" />
            ))}
          </div>
          <SkeletonLine className="h-80 rounded-2xl" />
        </div>
      )}
      {status === 'error' && <ErrorState message={error} onRetry={refetch} />}

      {status === 'success' && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-app-border bg-surface p-5">
              <p className="text-sm text-text-secondary">Revenue this month</p>
              <p className="mt-2 text-2xl font-bold">
                {formatCurrency(data.series[data.series.length - 1]?.revenue || 0)}
              </p>
              <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-primary">
                <TrendingUp size={14} aria-hidden="true" />
                Demo reporting period
              </p>
            </div>
            <div className="rounded-2xl border border-app-border bg-surface p-5">
              <p className="text-sm text-text-secondary">Orders this month</p>
              <p className="mt-2 text-2xl font-bold">
                {formatNumber(data.series[data.series.length - 1]?.orders || 0)}
              </p>
              <p className="mt-2 text-xs text-text-secondary">Across all demo categories</p>
            </div>
            <div className="rounded-2xl border border-app-border bg-surface p-5">
              <p className="text-sm text-text-secondary">Top category</p>
              <p className="mt-2 text-2xl font-bold">
                {[...data.categories].sort((a, b) => b.value - a.value)[0]?.name || '—'}
              </p>
              <p className="mt-2 text-xs text-text-secondary">Based on demo revenue share</p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
            <section className="rounded-2xl border border-app-border bg-surface p-5 shadow-sm">
              <h2 className="font-semibold text-text-primary">Revenue by month</h2>
              <p className="mt-1 text-xs text-text-secondary">Last six demo months</p>
              <div className="mt-6 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.series} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5EAE3" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#718071', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#718071', fontSize: 12 }} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="revenue" name="Revenue" fill="#16834A" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="rounded-2xl border border-app-border bg-surface p-5 shadow-sm">
              <h2 className="font-semibold text-text-primary">Category mix</h2>
              <p className="mt-1 text-xs text-text-secondary">Share of demo revenue</p>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.categories}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                    >
                      {data.categories.map((entry, index) => (
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

          <section className="mt-6 rounded-2xl border border-app-border bg-surface p-5 shadow-sm">
            <h2 className="font-semibold text-text-primary">Best-selling products</h2>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="border-b border-app-border text-xs uppercase text-text-secondary">
                  <tr>
                    <th className="py-2">Product</th>
                    <th className="py-2">Units sold</th>
                    <th className="py-2">Revenue</th>
                    <th className="py-2 text-right">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {data.bestSellers.map((item) => {
                    const maxRevenue = Math.max(...data.bestSellers.map((entry) => entry.revenue))
                    return (
                      <tr key={item.name} className="border-b border-app-border last:border-0">
                        <td className="py-3 font-medium">{item.name}</td>
                        <td className="py-3 text-text-secondary">{formatNumber(item.units)}</td>
                        <td className="py-3 font-semibold">{formatCurrency(item.revenue)}</td>
                        <td className="py-3">
                          <div className="ml-auto h-2 w-32 overflow-hidden rounded-full bg-app-background">
                            <div
                              className="h-full rounded-full bg-brand-primary"
                              style={{ width: `${Math.round((item.revenue / maxRevenue) * 100)}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  )
}
