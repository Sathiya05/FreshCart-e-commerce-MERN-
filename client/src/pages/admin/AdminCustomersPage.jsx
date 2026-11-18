import { useEffect, useMemo, useState } from 'react'
import { Eye, Search } from 'lucide-react'
import AdminPageHeader from '../../components/AdminPageHeader.jsx'
import Badge from '../../components/Badge.jsx'
import DemoBadge from '../../components/DemoBadge.jsx'
import Button from '../../components/Button.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import DataTable from '../../components/DataTable.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import Modal from '../../components/Modal.jsx'
import { TableSkeleton } from '../../components/Skeleton.jsx'
import { useAppDispatch } from '../../redux/hooks.js'
import { pushToast } from '../../redux/uiSlice.js'
import { formatCurrency, formatNumber } from '../../utils/format.js'
import { useAsync } from '../../hooks/useAsync.js'
import { getDemoAdminCustomers } from '../../services/admin.service.js'

const statusTone = { Active: 'success', Inactive: 'neutral' }

export default function AdminCustomersPage() {
  const dispatch = useAppDispatch()
  const { status, data, error, refetch } = useAsync(getDemoAdminCustomers, [])
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [customerToDeactivate, setCustomerToDeactivate] = useState(null)

  useEffect(() => {
    if (data) setCustomers(data)
  }, [data])

  useEffect(() => {
    if (!selectedCustomer) return
    const latest = customers.find((customer) => customer.id === selectedCustomer.id)
    if (latest) setSelectedCustomer(latest)
  }, [customers, selectedCustomer])

  const filtered = useMemo(
    () =>
      customers.filter((customer) => {
        const matchesSearch =
          customer.name.toLowerCase().includes(search.toLowerCase()) ||
          customer.email.toLowerCase().includes(search.toLowerCase())
        const matchesStatus = statusFilter === 'all' || customer.status === statusFilter
        return matchesSearch && matchesStatus
      }),
    [customers, search, statusFilter],
  )

  const setCustomerStatus = (id, nextStatus) => {
    setCustomers((current) =>
      current.map((customer) =>
        customer.id === id ? { ...customer, status: nextStatus } : customer,
      ),
    )
    dispatch(
      pushToast({
        title: 'Customer status updated',
        message: `Demo account is now ${nextStatus.toLowerCase()}.`,
      }),
    )
  }

  const columns = [
    {
      key: 'name',
      label: 'Customer',
      render: (row) => (
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-secondary text-xs font-bold text-brand-dark">
            {row.name.charAt(0)}
          </span>
          <div>
            <p className="font-medium text-text-primary">{row.name}</p>
            <p className="text-xs text-text-secondary">{row.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'phone', label: 'Phone', render: (row) => row.phone },
    {
      key: 'orders',
      label: 'Orders',
      render: (row) => formatNumber(row.orders),
    },
    {
      key: 'spent',
      label: 'Lifetime spend',
      render: (row) => <span className="font-semibold">{formatCurrency(row.spent)}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Badge tone={statusTone[row.status] || 'neutral'}>{row.status}</Badge>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedCustomer(row)}
            className="rounded-lg p-2 text-text-secondary hover:bg-app-background hover:text-brand-primary"
            aria-label={`View ${row.name}`}
          >
            <Eye size={16} aria-hidden="true" />
          </button>
          {row.status === 'Active' ? (
            <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setCustomerToDeactivate(row)}>
              Deactivate
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setCustomerStatus(row.id, 'Active')}>
              Activate
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <>
      <AdminPageHeader
        title="Customers"
        description="Preview layout only — customer APIs arrive with Phase 4."
        actions={<DemoBadge />}
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name or email…"
            aria-label="Search customers"
            className="h-11 w-full rounded-xl border border-app-border bg-surface pl-9 pr-3 text-sm outline-none focus:border-brand-primary"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter customers by status"
          className="h-11 rounded-xl border border-app-border bg-surface px-3 text-sm outline-none focus:border-brand-primary"
        >
          <option value="all">All customers</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {status === 'loading' && <TableSkeleton rows={5} columns={6} />}
      {status === 'error' && <ErrorState message={error} onRetry={refetch} />}
      {status === 'success' && (
        <DataTable columns={columns} rows={filtered} emptyMessage="No customers match your filters." />
      )}

      <Modal
        open={Boolean(selectedCustomer)}
        onClose={() => setSelectedCustomer(null)}
        title={selectedCustomer?.name || 'Customer'}
        description="Demo customer profile. Customer management APIs are planned for Phase 4."
        footer={<Button variant="outline" onClick={() => setSelectedCustomer(null)}>Close</Button>}
      >
        {selectedCustomer && (
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-app-background p-3">
              <dt className="text-xs text-text-secondary">Email</dt>
              <dd className="mt-1 text-sm font-medium">{selectedCustomer.email}</dd>
            </div>
            <div className="rounded-xl bg-app-background p-3">
              <dt className="text-xs text-text-secondary">Phone</dt>
              <dd className="mt-1 text-sm font-medium">{selectedCustomer.phone}</dd>
            </div>
            <div className="rounded-xl bg-app-background p-3">
              <dt className="text-xs text-text-secondary">Orders</dt>
              <dd className="mt-1 text-sm font-semibold">{formatNumber(selectedCustomer.orders)}</dd>
            </div>
            <div className="rounded-xl bg-app-background p-3">
              <dt className="text-xs text-text-secondary">Lifetime spend</dt>
              <dd className="mt-1 text-sm font-semibold">{formatCurrency(selectedCustomer.spent)}</dd>
            </div>
            <div className="rounded-xl bg-app-background p-3">
              <dt className="text-xs text-text-secondary">Joined</dt>
              <dd className="mt-1 text-sm font-medium">{selectedCustomer.joined}</dd>
            </div>
            <div className="rounded-xl bg-app-background p-3">
              <dt className="text-xs text-text-secondary">Status</dt>
              <dd className="mt-1"><Badge tone={statusTone[selectedCustomer.status] || 'neutral'}>{selectedCustomer.status}</Badge></dd>
            </div>
          </dl>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(customerToDeactivate)}
        onClose={() => setCustomerToDeactivate(null)}
        onConfirm={() => setCustomerStatus(customerToDeactivate.id, 'Inactive')}
        title="Deactivate this customer?"
        message={`${customerToDeactivate?.name || 'This customer'} will lose demo account access until reactivated.`}
        confirmLabel="Deactivate customer"
      />
    </>
  )
}
