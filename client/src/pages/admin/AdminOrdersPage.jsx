import { useEffect, useMemo, useState } from 'react'
import { Eye, RefreshCw, Search } from 'lucide-react'
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
import {
  getAdminOrders,
  updateAdminOrderStatus,
} from '../../services/commerce.service.js'
import { syncAdminPayments } from '../../services/admin.service.js'

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
  Failed: 'danger',
  Pending: 'warning',
}

export default function AdminOrdersPage() {
  const dispatch = useAppDispatch()
  const { status, data, error, refetch } = useAsync(
    () => getAdminOrders({ limit: 60 }),
    [],
  )
  const [liveData, setLiveData] = useState(data)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [orderToCancel, setOrderToCancel] = useState(null)
  const [updating, setUpdating] = useState(false)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    if (data) setLiveData(data)
  }, [data])

  useEffect(() => {
    const timer = setInterval(() => {
      getAdminOrders({ limit: 60 })
        .then((updated) => setLiveData(updated))
        .catch(() => {
          // Keep the last known orders if a background refresh fails.
        })
    }, 20000)
    return () => clearInterval(timer)
  }, [])

  const syncPayments = async () => {
    setSyncing(true)
    try {
      const result = await syncAdminPayments()
      refetch()
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

  const orders = liveData?.items || []
  const selectedOrder = orders.find((order) => order.id === selectedOrderId) || null

  const filtered = useMemo(
    () =>
      orders.filter((order) => {
        const orderId = (order.orderNumber || order.id || '').toLowerCase()
        const matchesSearch = orderId.includes(search.toLowerCase())
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter
        return matchesSearch && matchesStatus
      }),
    [orders, search, statusFilter],
  )

  const updateStatus = async (id, nextStatus) => {
    setUpdating(true)
    try {
      await updateAdminOrderStatus(id, nextStatus)
      dispatch(
        pushToast({
          title: 'Order status updated',
          message: `${id} is now ${nextStatus}.`,
        }),
      )
      await refetch()
    } catch (apiError) {
      dispatch(
        pushToast({
          type: 'error',
          title: 'Could not update status',
          message: apiError?.message || 'Please try again.',
        }),
      )
    } finally {
      setUpdating(false)
    }
  }

  const handleCancel = async (order) => {
    await updateStatus(order.id, 'Cancelled')
    setOrderToCancel(null)
  }

  const columns = [
    {
      key: 'id',
      label: 'Order',
      render: (row) => (
        <div>
          <p className="font-medium text-text-primary">{row.orderNumber || row.id}</p>
          <p className="text-xs text-text-secondary">{row.customer?.name || 'Customer'}</p>
        </div>
      ),
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
            onClick={() => setSelectedOrderId(row.id)}
            className="rounded-lg p-2 text-text-secondary hover:bg-app-background hover:text-brand-primary"
            aria-label={`View ${row.orderNumber || row.id}`}
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
        description="Review live orders, payment status and fulfilment updates."
        actions={
          <Button variant="outline" onClick={syncPayments} disabled={syncing}>
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} aria-hidden="true" />
            {syncing ? 'Syncing…' : 'Sync payments'}
          </Button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search order number…"
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
        onClose={() => setSelectedOrderId(null)}
        title={`Order ${selectedOrder?.orderNumber || selectedOrder?.id || ''}`}
        description="Live order record from the API."
        footer={<Button variant="outline" onClick={() => setSelectedOrderId(null)}>Close</Button>}
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
              <label htmlFor="admin-order-status" className="mb-2 block text-sm font-medium">
                Update status
              </label>
              <select
                id="admin-order-status"
                value={selectedOrder.status}
                disabled={updating}
                onChange={(event) => updateStatus(selectedOrder.id, event.target.value)}
                className="h-11 w-full rounded-xl border border-app-border bg-surface px-3 text-sm outline-none focus:border-brand-primary"
              >
                {statuses.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>

            <div>
              <h3 className="text-sm font-semibold">Customer</h3>
              <p className="mt-2 text-sm text-text-secondary">
                {selectedOrder.customer?.name || 'Customer'}
                {selectedOrder.customer?.email ? ` · ${selectedOrder.customer.email}` : ''}
              </p>
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
                {selectedOrder.address?.fullName}<br />
                {selectedOrder.address?.addressLine}<br />
                {selectedOrder.address?.city}, {selectedOrder.address?.state} {selectedOrder.address?.pincode}
              </p>
              {selectedOrder.deliverySlot && (
                <p className="mt-2 text-xs text-text-secondary">
                  Slot: {selectedOrder.deliverySlot}
                </p>
              )}
              {selectedOrder.deliveryInstructions && (
                <p className="mt-1 text-xs text-text-secondary">
                  Instructions: {selectedOrder.deliveryInstructions}
                </p>
              )}
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
        onConfirm={() => handleCancel(orderToCancel)}
        title="Cancel this order?"
        message={`${orderToCancel?.orderNumber || orderToCancel?.id || 'This order'} will be marked cancelled and its stock restored. Paid-order refunds are handled manually; Razorpay refund APIs are not connected.`}
        confirmLabel="Cancel order"
      />
    </>
  )
}
