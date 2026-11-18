import { BarChart3 } from 'lucide-react'
import AdminPageHeader from '../../components/AdminPageHeader.jsx'
import DemoBadge from '../../components/DemoBadge.jsx'

export default function AdminSalesReportsPage() {
  return (
    <>
      <AdminPageHeader
        title="Sales reports"
        description="Real sales analytics will appear here after commerce and payment APIs are added."
        actions={<DemoBadge />}
      />

      <section className="rounded-2xl border border-app-border bg-surface p-8 text-center shadow-sm">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-secondary text-brand-dark">
          <BarChart3 size={26} aria-hidden="true" />
        </span>
        <h2 className="mt-5 text-xl font-semibold text-text-primary">Reports are not connected yet</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-text-secondary">
          Revenue, orders and category performance depend on the Phase 4 commerce API and
          Phase 5 payment verification. No sample revenue figures are shown.
        </p>
      </section>
    </>
  )
}
