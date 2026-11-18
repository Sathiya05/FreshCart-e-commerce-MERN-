import { useEffect, useMemo, useState } from 'react'
import { Copy, Pencil, Plus, Search, Trash2 } from 'lucide-react'
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
import { getDemoAdminCoupons } from '../../services/admin.service.js'

const emptyCoupon = {
  code: '',
  discountType: 'percent',
  discountValue: '',
  minimumOrderAmount: '',
  maximumDiscount: '',
  expiryDate: '',
  usageLimit: '',
  isActive: true,
}

const discountLabel = (coupon) =>
  coupon.discountType === 'percent'
    ? `${coupon.discountValue}% off`
    : `${formatCurrency(coupon.discountValue)} off`

export default function AdminCouponsPage() {
  const dispatch = useAppDispatch()
  const { status, data, error, refetch } = useAsync(getDemoAdminCoupons, [])
  const [coupons, setCoupons] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyCoupon)
  const [couponToDelete, setCouponToDelete] = useState(null)

  useEffect(() => {
    if (data) setCoupons(data)
  }, [data])

  const filtered = useMemo(
    () =>
      coupons.filter((coupon) => {
        const matchesSearch = coupon.code.toLowerCase().includes(search.toLowerCase())
        const matchesStatus =
          statusFilter === 'all' ||
          (statusFilter === 'active' && coupon.isActive) ||
          (statusFilter === 'inactive' && !coupon.isActive)
        return matchesSearch && matchesStatus
      }),
    [coupons, search, statusFilter],
  )

  const openCreate = () => {
    setEditing(null)
    setForm(emptyCoupon)
    setModalOpen(true)
  }

  const openEdit = (coupon) => {
    setEditing(coupon)
    setForm({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      minimumOrderAmount: String(coupon.minimumOrderAmount),
      maximumDiscount: String(coupon.maximumDiscount),
      expiryDate: coupon.expiryDate,
      usageLimit: String(coupon.usageLimit),
      isActive: coupon.isActive,
    })
    setModalOpen(true)
  }

  const update = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const payload = {
      ...form,
      code: form.code.trim().toUpperCase(),
      discountValue: Number(form.discountValue) || 0,
      minimumOrderAmount: Number(form.minimumOrderAmount) || 0,
      maximumDiscount: Number(form.maximumDiscount) || 0,
      usageLimit: Number(form.usageLimit) || 0,
    }

    if (editing) {
      setCoupons((current) =>
        current.map((coupon) => (coupon.id === editing.id ? { ...coupon, ...payload } : coupon)),
      )
      dispatch(pushToast({ title: 'Coupon updated', message: `${payload.code} was updated in the demo.` }))
    } else {
      setCoupons((current) => [
        {
          ...payload,
          id: `coupon-demo-${Date.now()}`,
          usedCount: 0,
        },
        ...current,
      ])
      dispatch(pushToast({ title: 'Coupon created', message: `${payload.code} is now available in the demo.` }))
    }
    setModalOpen(false)
  }

  const copyCode = (code) => {
    navigator.clipboard?.writeText(code)
    dispatch(pushToast({ type: 'info', message: `${code} copied to clipboard.` }))
  }

  const toggleStatus = (coupon) => {
    setCoupons((current) =>
      current.map((item) =>
        item.id === coupon.id ? { ...item, isActive: !item.isActive } : item,
      ),
    )
    dispatch(
      pushToast({
        type: 'info',
        message: `${coupon.code} is now ${coupon.isActive ? 'inactive' : 'active'} in the demo.`,
      }),
    )
  }

  const columns = [
    {
      key: 'code',
      label: 'Code',
      render: (row) => (
        <div>
          <p className="font-semibold text-text-primary">{row.code}</p>
          <button
            type="button"
            onClick={() => copyCode(row.code)}
            className="inline-flex items-center gap-1 text-xs text-text-secondary hover:text-brand-primary"
          >
            <Copy size={12} aria-hidden="true" /> Copy
          </button>
        </div>
      ),
    },
    { key: 'discount', label: 'Discount', render: (row) => discountLabel(row) },
    {
      key: 'minimum',
      label: 'Minimum order',
      render: (row) => formatCurrency(row.minimumOrderAmount),
    },
    { key: 'expiry', label: 'Expires', render: (row) => row.expiryDate },
    {
      key: 'usage',
      label: 'Usage',
      render: (row) => `${formatNumber(row.usedCount)} / ${formatNumber(row.usageLimit)}`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge tone={row.isActive ? 'success' : 'neutral'}>
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => toggleStatus(row)}
            className="rounded-lg px-2 py-1 text-xs font-medium text-text-secondary hover:bg-app-background hover:text-brand-primary"
          >
            {row.isActive ? 'Disable' : 'Enable'}
          </button>
          <button
            type="button"
            onClick={() => openEdit(row)}
            className="rounded-lg p-2 text-text-secondary hover:bg-app-background hover:text-brand-primary"
            aria-label={`Edit ${row.code}`}
          >
            <Pencil size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setCouponToDelete(row)}
            className="rounded-lg p-2 text-text-secondary hover:bg-red-50 hover:text-red-600"
            aria-label={`Delete ${row.code}`}
          >
            <Trash2 size={15} aria-hidden="true" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      <AdminPageHeader
        title="Coupons"
        description="Preview layout only — coupon APIs arrive with Phase 4."
        actions={
          <>
            <DemoBadge />
            <Button onClick={openCreate}><Plus size={16} aria-hidden="true" /> Add coupon</Button>
          </>
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search coupon codes…"
            aria-label="Search coupons"
            className="h-11 w-full rounded-xl border border-app-border bg-surface pl-9 pr-3 text-sm outline-none focus:border-brand-primary"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter coupons by status"
          className="h-11 rounded-xl border border-app-border bg-surface px-3 text-sm outline-none focus:border-brand-primary"
        >
          <option value="all">All coupons</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {status === 'loading' && <TableSkeleton rows={4} columns={7} />}
      {status === 'error' && <ErrorState message={error} onRetry={refetch} />}
      {status === 'success' && (
        <DataTable columns={columns} rows={filtered} emptyMessage="No coupons match your filters." />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit coupon' : 'Add a coupon'}
        description="Coupon changes are local preview actions. Backend validation arrives in Phase 4."
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" form="coupon-form">Save coupon</Button>
          </>
        }
      >
        <form id="coupon-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="coupon-code" className="mb-1.5 block text-sm font-medium">Coupon code</label>
            <input
              id="coupon-code"
              required
              value={form.code}
              onChange={update('code')}
              placeholder="FRESH10"
              className="h-11 w-full rounded-xl border border-app-border px-3 text-sm uppercase outline-none focus:border-brand-primary"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="coupon-type" className="mb-1.5 block text-sm font-medium">Discount type</label>
              <select
                id="coupon-type"
                value={form.discountType}
                onChange={update('discountType')}
                className="h-11 w-full rounded-xl border border-app-border px-3 text-sm outline-none focus:border-brand-primary"
              >
                <option value="percent">Percentage</option>
                <option value="fixed">Fixed amount</option>
              </select>
            </div>
            <div>
              <label htmlFor="coupon-value" className="mb-1.5 block text-sm font-medium">Discount value</label>
              <input
                id="coupon-value"
                type="number"
                min="0"
                required
                value={form.discountValue}
                onChange={update('discountValue')}
                className="h-11 w-full rounded-xl border border-app-border px-3 text-sm outline-none focus:border-brand-primary"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="coupon-minimum" className="mb-1.5 block text-sm font-medium">Minimum order</label>
              <input
                id="coupon-minimum"
                type="number"
                min="0"
                required
                value={form.minimumOrderAmount}
                onChange={update('minimumOrderAmount')}
                className="h-11 w-full rounded-xl border border-app-border px-3 text-sm outline-none focus:border-brand-primary"
              />
            </div>
            <div>
              <label htmlFor="coupon-maximum" className="mb-1.5 block text-sm font-medium">Maximum discount</label>
              <input
                id="coupon-maximum"
                type="number"
                min="0"
                required
                value={form.maximumDiscount}
                onChange={update('maximumDiscount')}
                className="h-11 w-full rounded-xl border border-app-border px-3 text-sm outline-none focus:border-brand-primary"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="coupon-expiry" className="mb-1.5 block text-sm font-medium">Expiry date</label>
              <input
                id="coupon-expiry"
                type="date"
                required
                value={form.expiryDate}
                onChange={update('expiryDate')}
                className="h-11 w-full rounded-xl border border-app-border px-3 text-sm outline-none focus:border-brand-primary"
              />
            </div>
            <div>
              <label htmlFor="coupon-limit" className="mb-1.5 block text-sm font-medium">Usage limit</label>
              <input
                id="coupon-limit"
                type="number"
                min="1"
                required
                value={form.usageLimit}
                onChange={update('usageLimit')}
                className="h-11 w-full rounded-xl border border-app-border px-3 text-sm outline-none focus:border-brand-primary"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={update('isActive')}
              className="h-4 w-4 rounded border-app-border text-brand-primary focus:ring-brand-primary"
            />
            Coupon is active
          </label>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(couponToDelete)}
        onClose={() => setCouponToDelete(null)}
        onConfirm={() => {
          setCoupons((current) => current.filter((coupon) => coupon.id !== couponToDelete.id))
          dispatch(pushToast({ type: 'info', message: `${couponToDelete.code} deleted from the demo.` }))
        }}
        title="Delete this coupon?"
        message={`${couponToDelete?.code || 'This coupon'} will be removed from the demo promotion list.`}
        confirmLabel="Delete coupon"
      />
    </>
  )
}
