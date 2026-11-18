import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, PackageCheck, Search, Warehouse } from 'lucide-react'
import AdminPageHeader from '../../components/AdminPageHeader.jsx'
import Badge from '../../components/Badge.jsx'
import Button from '../../components/Button.jsx'
import DataTable from '../../components/DataTable.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import Modal from '../../components/Modal.jsx'
import { TableSkeleton } from '../../components/Skeleton.jsx'
import { useAppDispatch } from '../../redux/hooks.js'
import { pushToast } from '../../redux/uiSlice.js'
import { formatNumber } from '../../utils/format.js'
import { useAsync } from '../../hooks/useAsync.js'
import { getAdminInventory } from '../../services/admin.service.js'

const statusTone = {
  Healthy: 'success',
  Moderate: 'warning',
  'Low stock': 'danger',
}

const getStatus = (stock) =>
  stock <= 15 ? 'Low stock' : stock <= 30 ? 'Moderate' : 'Healthy'

export default function AdminInventoryPage() {
  const dispatch = useAppDispatch()
  const { status, data, error, refetch } = useAsync(getAdminInventory, [])
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [stockFilter, setStockFilter] = useState('all')
  const [adjusting, setAdjusting] = useState(null)
  const [newStock, setNewStock] = useState('')

  useEffect(() => {
    if (data) setItems(data)
  }, [data])

  const filtered = useMemo(
    () =>
      items.filter((item) => {
        const matchesSearch =
          item.name.toLowerCase().includes(search.toLowerCase()) ||
          item.sku.toLowerCase().includes(search.toLowerCase())
        const matchesStatus =
          stockFilter === 'all' || item.status === stockFilter
        return matchesSearch && matchesStatus
      }),
    [items, search, stockFilter],
  )

  const lowStockCount = items.filter((item) => item.status === 'Low stock').length

  const openAdjust = (item) => {
    setAdjusting(item)
    setNewStock(String(item.stock))
  }

  const handleAdjust = (event) => {
    event.preventDefault()
    const quantity = Math.max(Number(newStock) || 0, 0)
    setItems((current) =>
      current.map((item) =>
        item.id === adjusting.id
          ? { ...item, stock: quantity, status: getStatus(quantity) }
          : item,
      ),
    )
    dispatch(
      pushToast({
        title: 'Stock updated',
        message: `${adjusting.name} now shows ${formatNumber(quantity)} units in this demo.`,
      }),
    )
    setAdjusting(null)
  }

  const columns = [
    {
      key: 'name',
      label: 'Product',
      render: (row) => (
        <div>
          <p className="font-medium text-text-primary">{row.name}</p>
          <p className="text-xs text-text-secondary">{row.sku}</p>
        </div>
      ),
    },
    { key: 'category', label: 'Category', render: (row) => row.category },
    {
      key: 'stock',
      label: 'On hand',
      render: (row) => (
        <span className="font-semibold text-text-primary">{formatNumber(row.stock)}</span>
      ),
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
        <Button size="sm" variant="outline" onClick={() => openAdjust(row)}>
          Adjust
        </Button>
      ),
    },
  ]

  return (
    <>
      <AdminPageHeader
        title="Inventory"
        description="Monitor stock levels and record quick demo adjustments."
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-app-border bg-surface p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-secondary text-brand-dark">
              <Warehouse size={19} aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs text-text-secondary">Tracked products</p>
              <p className="text-xl font-bold">{formatNumber(items.length)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-app-border bg-surface p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-700">
              <AlertTriangle size={19} aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs text-text-secondary">Low-stock items</p>
              <p className="text-xl font-bold">{formatNumber(lowStockCount)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-app-border bg-surface p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700">
              <PackageCheck size={19} aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs text-text-secondary">Healthy stock</p>
              <p className="text-xl font-bold">
                {formatNumber(items.filter((item) => item.status === 'Healthy').length)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search product or SKU…"
            aria-label="Search inventory"
            className="h-11 w-full rounded-xl border border-app-border bg-surface pl-9 pr-3 text-sm outline-none focus:border-brand-primary"
          />
        </div>
        <select
          value={stockFilter}
          onChange={(event) => setStockFilter(event.target.value)}
          aria-label="Filter inventory by status"
          className="h-11 rounded-xl border border-app-border bg-surface px-3 text-sm outline-none focus:border-brand-primary"
        >
          <option value="all">All statuses</option>
          <option value="Healthy">Healthy</option>
          <option value="Moderate">Moderate</option>
          <option value="Low stock">Low stock</option>
        </select>
      </div>

      {status === 'loading' && <TableSkeleton rows={6} columns={5} />}
      {status === 'error' && <ErrorState message={error} onRetry={refetch} />}
      {status === 'success' && (
        <DataTable
          columns={columns}
          rows={filtered}
          emptyMessage="No inventory items match your filters."
        />
      )}

      <Modal
        open={Boolean(adjusting)}
        onClose={() => setAdjusting(null)}
        title="Adjust stock"
        description={`Demo stock level for ${adjusting?.name || 'this product'}.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setAdjusting(null)}>Cancel</Button>
            <Button type="submit" form="inventory-form">Save adjustment</Button>
          </>
        }
      >
        <form id="inventory-form" onSubmit={handleAdjust}>
          <label htmlFor="inventory-stock" className="mb-2 block text-sm font-medium">
            Quantity in stock
          </label>
          <input
            id="inventory-stock"
            type="number"
            min="0"
            required
            value={newStock}
            onChange={(event) => setNewStock(event.target.value)}
            className="h-11 w-full rounded-xl border border-app-border px-3 text-sm outline-none focus:border-brand-primary"
          />
          <p className="mt-3 text-xs text-text-secondary">
            Inventory persistence connects to the backend in Phase 4. This change is local only.
          </p>
        </form>
      </Modal>
    </>
  )
}
