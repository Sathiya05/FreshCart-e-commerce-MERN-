import { useEffect, useMemo, useState } from 'react'
import { Eye, Search } from 'lucide-react'
import AdminPageHeader from '../../components/AdminPageHeader.jsx'
import Badge from '../../components/Badge.jsx'
import Button from '../../components/Button.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import DataTable from '../../components/DataTable.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import Modal from '../../components/Modal.jsx'
import OrderStatusBadge from '../../components/OrderStatusBadge.jsx'
import { TableSkeleton } from '../../components/Skeleton.jsx'
import { useAppDispatch } from '../../redux/hooks.js'
import { pushToast } from '../../redux/uiSlice.js'
import { formatCurrency, formatNumber } from '../../utils/format.js'
import { useAsync } from '../../hooks/useAsync.js'
import { getAdminOrders } from '../../services/admin.service.js'

const statuses = [
  'Pending',
  'Processing',
  'Packed',
  'Shipped',
  'Out for delivery',
  'Delivered',
  'Cancelled',
]

const paymentTone = {
  Paid: 'success',
  Refunded: 'danger',
  Pending: 'warning',
}

export default function AdminOrdersPage() {
  const dispatch = useAppDispatch()
  const { status, data, error, refetch } = useAsync(getAdminOrders, [])
  const [orders, setOrders] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [orderToCancel, setOrderToCancel] = useState(null)

  useEffect(() => {
    if (data) setOrders(data)
  }, [data])

  useEffect(() => {
    if (!selectedOrder) return
    const latest = orders.find((order) => order.id === selectedOrder.id)
    if (latest) setSelectedOrder(latest)
  }, [orders, selectedOrder])

  const filtered = useMemo(
    () =>
      orders.filter((order) => {
        const matchesSearch = order.id.toLowerCase().includes(search.toLowerCase())
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter
        return matchesSearch && matchesStatus
      }),
    [orders, search, statusFilter],
  )

  const updateStatus = (id, nextStatus) => {
    setOrders((current) =>
      current.map((order) => (order.id === id ? { ...order, status: nextStatus } : order)),
    )
    dispatch(
      pushToast({
        title: 'Order status updated',
        message: `${id} is now ${nextStatus} in this demo.`,
      }),
    )
  }

  const columns = [
    {
      key: 'id',
      label: 'Order',
      render: (row) => <p className="font-medium text-text-primary">{row.id}</p>,
    },
    { key: 'date', label: 'Date', render: (row) => row.date },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <OrderStatusBadge status={row.status} />,
    },
    {
      key: 'payment',
      label: 'Payment',
      render: (row) => (
        <Badge tone={paymentTone[row.paymentStatus] || 'neutral'}>{row.paymentStatus}</Badge>
      ),
    },
    {
      key: 'total',
      label: 'Total',
      render: (row) => (
        <span className="font-semibold">{formatCurrency(row.totalAmount)}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSelectedOrder(row)}
            className="rounded-lg p-2 text-text-secondary hover:bg-app-background hover:text-brand-primary"
            aria-label={`View ${row.id}`}
          >
            <Eye size={16} aria-hidden="true" />
          </button>
          {row.status !== 'Cancelled' && (
            <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setOrderToCancel(row)}>
              Cancel
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <>
      <AdminPageHeader
        title="Orders"
        description="Review order details, update statuses and handle demo cancellations."
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search order ID…"
            aria-label="Search orders"
            className="h-11 w-full rounded-xl border border-app-border bg-surface pl-9 pr-3 text-sm outline-none focus:border-brand-primary"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter orders by status"
          className="h-11 rounded-xl border border-app-border bg-surface px-3 text-sm outline-none focus:border-brand-primary"
        >
          <option value="all">All statuses</option>
          {statuses.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </div>

      {status === 'loading' && <TableSkeleton rows={5} columns={6} />}
      {status === 'error' && <ErrorState message={error} onRetry={refetch} />}
      {status === 'success' && (
        <DataTable columns={columns} rows={filtered} emptyMessage="No orders match your filters." />
      )}

      <Modal
        open={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        title={`Order ${selectedOrder?.id || ''}`}
        description="Demo order detail. Real order APIs arrive in Phase 4."
        footer={<Button variant="outline" onClick={() => setSelectedOrder(null)}>Close</Button>}
      >
        {selectedOrder && (
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-app-background p-3">
                <p className="text-xs text-text-secondary">Placed on</p>
                <p className="mt-1 text-sm font-medium">{selectedOrder.date}</p>
              </div>
              <div className="rounded-xl bg-app-background p-3">
                <p className="text-xs text-text-secondary">Total</p>
                <p className="mt-1 text-sm font-semibold">{formatCurrency(selectedOrder.totalAmount)}</p>
              </div>
              <div className="rounded-xl bg-app-background p-3">
                <p className="text-xs text-text-secondary">Payment</p>
                <p className="mt-1 text-sm font-medium">{selectedOrder.paymentMethod}</p>
              </div>
              <div className="rounded-xl bg-app-background p-3">
                <p className="text-xs text-text-secondary">Items</p>
                <p className="mt-1 text-sm font-medium">{formatNumber(selectedOrder.itemCount)}</p>
              </div>
            </div>

            <div>
              <label htmlFor="demo-order-status" className="mb-2 block text-sm font-medium">
                Update status
              </label>
              <select
                id="demo-order-status"
                value={selectedOrder.status}
                onChange={(event) => updateStatus(selectedOrder.id, event.target.value)}
                className="h-11 w-full rounded-xl border border-app-border bg-surface px-3 text-sm outline-none focus:border-brand-primary"
              >
                {statuses.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>

            <div>
              <h3 className="text-sm font-semibold">Items</h3>
              <div className="mt-3 space-y-3">
                {selectedOrder.items.map((item) => (
                  <div key={item.productId} className="flex items-center gap-3">
                    <img src={item.image} alt="" className="h-11 w-11 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-text-secondary">{item.quantity} × {item.unit}</p>
                    </div>
                    <p className="text-sm font-semibold">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold">Delivery address</h3>
              <p className="mt-2 text-sm leading-6 text-text-secondary">
                {selectedOrder.address.fullName}<br />
                {selectedOrder.address.addressLine}<br />
                {selectedOrder.address.city}, {selectedOrder.address.state} {selectedOrder.address.pincode}
              </p>
              <p className="mt-2 text-xs text-text-secondary">
                Slot: {selectedOrder.deliverySlot}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold">Timeline</h3>
              <ol className="mt-3 space-y-2">
                {selectedOrder.timeline.map((step) => (
                  <li key={step.label} className="flex items-center gap-3 text-sm">
                    <span
                      className={`h-2 w-2 rounded-full ${step.complete ? 'bg-brand-primary' : 'bg-app-border'}`}
                      aria-hidden="true"
                    />
                    <span className={step.complete ? 'text-text-primary' : 'text-text-secondary'}>
                      {step.label}
                    </span>
                    <span className="ml-auto text-xs text-text-secondary">{step.date}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(orderToCancel)}
        onClose={() => setOrderToCancel(null)}
        onConfirm={() => {
          setOrders((current) =>
            current.map((order) =>
              order.id === orderToCancel.id
                ? { ...order, status: 'Cancelled', paymentStatus: 'Refunded' }
                : order,
            ),
          )
          dispatch(
            pushToast({
              type: 'info',
              message: `${orderToCancel.id} cancelled in the demo. Refunds are processed in Phase 5.`,
            }),
          )
        }}
        title="Cancel this order?"
        message={`${orderToCancel?.id || 'This order'} will be marked cancelled and its demo payment shown as refunded.`}
        confirmLabel="Cancel order"
      />
    </>
  )
}
