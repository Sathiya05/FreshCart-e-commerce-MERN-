import { useEffect, useState } from 'react'
import { Eye, RefreshCw, Search } from 'lucide-react'
import AdminPageHeader from '../../components/AdminPageHeader.jsx'
import Badge from '../../components/Badge.jsx'
import Button from '../../components/Button.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import DataTable from '../../components/DataTable.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import Modal from '../../components/Modal.jsx'
import OrderStatusBadge from '../../components/OrderStatusBadge.jsx'
import Pagination from '../../components/Pagination.jsx'
import { TableSkeleton } from '../../components/Skeleton.jsx'
import { useAppDispatch } from '../../redux/hooks.js'
import { pushToast } from '../../redux/uiSlice.js'
import { formatCurrency, formatNumber } from '../../utils/format.js'
import { useAsync } from '../../hooks/useAsync.js'
import {
  confirmCodPayment,
  getAdminOrders,
  refundAdminOrder,
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

const paymentStatuses = ['Pending', 'Paid', 'Refunded', 'Failed']
const paymentMethods = ['cod', 'razorpay']

const paymentTone = {
  Paid: 'success',
  Refunded: 'danger',
  Failed: 'danger',
  Pending: 'warning',
}

const PAGE_SIZE = 20

export default function AdminOrdersPage() {
  const dispatch = useAppDispatch()
  const [searchInput, setSearchInput] = useState('')
  const [filters, setFilters] = useState({
    q: '',
    status: '',
    paymentStatus: '',
    paymentMethod: '',
    from: '',
    to: '',
    page: 1,
  })
  const { status, data, error, refetch } = useAsync(
    () =>
      getAdminOrders({
        limit: PAGE_SIZE,
        ...Object.fromEntries(
          Object.entries(filters).filter(([, value]) => value !== '' && value !== 1),
        ),
        page: filters.page,
      }),
    [filters],
  )

  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [orderToCancel, setOrderToCancel] = useState(null)
  const [orderToRefund, setOrderToRefund] = useState(null)
  const [statusNote, setStatusNote] = useState('')
  const [updating, setUpdating] = useState(false)
  const [syncing, setSyncing] = useState(false)

  // Debounce the search box so one API request covers a burst of keystrokes.
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((current) =>
        current.q === searchInput ? current : { ...current, q: searchInput, page: 1 },
      )
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const setFilter = (key, value) =>
    setFilters((current) => ({ ...current, [key]: value, page: 1 }))

  const orders = data?.items || []
  const selectedOrder = orders.find((order) => order.id === selectedOrderId) || null

  const runAction = async (task, title, successMessage) => {
    setUpdating(true)
    try {
      await task()
      dispatch(pushToast({ title, message: successMessage }))
      await refetch()
      return true
    } catch (apiError) {
      dispatch(
        pushToast({
          type: 'error',
          title: 'Could not update order',
          message: apiError?.message || 'Please try again.',
        }),
      )
      return false
    } finally {
      setUpdating(false)
    }
  }

  const updateStatus = async (id, nextStatus) =>
    runAction(
      () => updateAdminOrderStatus(id, nextStatus, statusNote),
      'Order status updated',
      `${id} is now ${nextStatus}.`,
    )

  const handleCancel = async (order) => {
    const ok = await updateStatus(order.id, 'Cancelled')
    if (ok) setOrderToCancel(null)
  }

  const handleConfirmCod = async (order) => {
    await runAction(
      () => confirmCodPayment(order.id),
      'Cash collection confirmed',
      `${order.orderNumber || order.id} is marked paid.`,
    )
  }

  const handleRefund = async (order) => {
    const ok = await runAction(
      () => refundAdminOrder(order.id),
      'Refund processed',
      `${order.orderNumber || order.id} has been refunded in Razorpay.`,
    )
    if (ok) setOrderToRefund(null)
  }

  const syncPayments = async () => {
    setSyncing(true)
    try {
      const result = await syncAdminPayments()
      await refetch()
      dispatch(
        pushToast({
          title: 'Payment sync complete',
          message: `${result.updated || 0} order(s) updated from Razorpay.`,
        }),
      )
    } catch (error) {
      dispatch(
        pushToast({
          type: 'error',
          title: 'Sync failed',
          message: error?.message || 'Could not sync payments right now.',
        }),
      )
    } finally {
      setSyncing(false)
    }
  }

  const columns = [
    {
      key: 'id',
      label: 'Order',
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-text-primary">{row.orderNumber || row.id}</p>
          <p className="truncate text-xs text-text-secondary">
            {row.customer?.name || row.address?.fullName || 'Customer'}
            {row.customer?.phone ? ` · ${row.customer.phone}` : ''}
          </p>
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
        <div className="space-y-1">
          <Badge tone={paymentTone[row.paymentStatus] || 'neutral'}>{row.paymentStatus}</Badge>
          <p className="text-xs text-text-secondary">
            {row.paymentMethodValue === 'cod' ? 'Cash on delivery' : 'Razorpay'}
          </p>
        </div>
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
            onClick={() => {
              setStatusNote('')
              setSelectedOrderId(row.id)
            }}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-text-secondary hover:bg-app-background hover:text-brand-primary"
            aria-label={`View ${row.orderNumber || row.id}`}
          >
            <Eye size={16} aria-hidden="true" />
          </button>
          {row.status !== 'Cancelled' && (
            <Button
              size="compact"
              variant="ghost"
              className="text-red-600"
              onClick={() => setOrderToCancel(row)}
            >
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
        description="Search, filter and manage live orders, payments and fulfilment."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={refetch} disabled={status === 'loading'}>
              <RefreshCw size={16} aria-hidden="true" />
              Refresh
            </Button>
            <Button variant="outline" onClick={syncPayments} disabled={syncing}>
              <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} aria-hidden="true" />
              {syncing ? 'Syncing…' : 'Sync payments'}
            </Button>
          </div>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Order ID, name, email, phone, SKU…"
            aria-label="Search orders"
            className="h-11 w-full rounded-xl border border-app-border bg-surface pl-9 pr-3 text-sm outline-none focus:border-brand-primary"
          />
        </div>
        <select
          value={filters.status}
          onChange={(event) => setFilter('status', event.target.value)}
          aria-label="Filter orders by status"
          className="h-11 rounded-xl border border-app-border bg-surface px-3 text-sm outline-none focus:border-brand-primary"
        >
          <option value="">All statuses</option>
          {statuses.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <select
          value={filters.paymentStatus}
          onChange={(event) => setFilter('paymentStatus', event.target.value)}
          aria-label="Filter orders by payment status"
          className="h-11 rounded-xl border border-app-border bg-surface px-3 text-sm outline-none focus:border-brand-primary"
        >
          <option value="">All payment statuses</option>
          {paymentStatuses.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <div className="flex gap-3">
          <select
            value={filters.paymentMethod}
            onChange={(event) => setFilter('paymentMethod', event.target.value)}
            aria-label="Filter orders by payment method"
            className="h-11 min-w-0 flex-1 rounded-xl border border-app-border bg-surface px-3 text-sm outline-none focus:border-brand-primary"
          >
            <option value="">All methods</option>
            {paymentMethods.map((item) => (
              <option key={item} value={item}>
                {item === 'cod' ? 'Cash on delivery' : 'Razorpay'}
              </option>
            ))}
          </select>
          <select
            value={filters.sort || ''}
            onChange={(event) => setFilter('sort', event.target.value)}
            aria-label="Sort orders"
            className="h-11 min-w-0 flex-1 rounded-xl border border-app-border bg-surface px-3 text-sm outline-none focus:border-brand-primary"
          >
            <option value="">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="total">Highest total</option>
          </select>
        </div>
        <div className="flex gap-3 sm:col-span-2">
          <label className="min-w-0 flex-1 text-xs text-text-secondary">
            From
            <input
              type="date"
              value={filters.from}
              onChange={(event) => setFilter('from', event.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-app-border bg-surface px-3 text-sm outline-none focus:border-brand-primary"
            />
          </label>
          <label className="min-w-0 flex-1 text-xs text-text-secondary">
            To
            <input
              type="date"
              value={filters.to}
              onChange={(event) => setFilter('to', event.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-app-border bg-surface px-3 text-sm outline-none focus:border-brand-primary"
            />
          </label>
        </div>
      </div>

      {status === 'loading' && <TableSkeleton rows={5} columns={6} />}
      {status === 'error' && <ErrorState message={error} onRetry={refetch} />}
      {status === 'success' && (
        <>
          <DataTable columns={columns} rows={orders} emptyMessage="No orders match your filters." />
          <Pagination
            page={data?.page || 1}
            pages={data?.pages || 1}
            onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
          />
        </>
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
                <p className="mt-1 text-sm font-medium">
                  {selectedOrder.paymentStatus} · {selectedOrder.paymentMethod}
                </p>
              </div>
              <div className="rounded-xl bg-app-background p-3">
                <p className="text-xs text-text-secondary">Items</p>
                <p className="mt-1 text-sm font-medium">{formatNumber(selectedOrder.itemCount)}</p>
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-app-border p-4">
              <div>
                <label htmlFor="admin-order-status" className="mb-2 block text-sm font-medium">
                  Update fulfilment status
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
                <label htmlFor="admin-order-note" className="mb-2 block text-sm font-medium">
                  Internal note <span className="font-normal text-text-secondary">(optional)</span>
                </label>
                <input
                  id="admin-order-note"
                  value={statusNote}
                  onChange={(event) => setStatusNote(event.target.value)}
                  maxLength={300}
                  placeholder="e.g. Customer requested a later slot"
                  className="h-11 w-full rounded-xl border border-app-border bg-surface px-3 text-sm outline-none focus:border-brand-primary"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedOrder.paymentMethodValue === 'cod' &&
                  selectedOrder.paymentStatus !== 'Paid' &&
                  selectedOrder.status !== 'Cancelled' && (
                    <Button
                      size="compact"
                      variant="outline"
                      disabled={updating || !['Out for delivery', 'Delivered'].includes(selectedOrder.status)}
                      onClick={() => handleConfirmCod(selectedOrder)}
                    >
                      Confirm cash collected
                    </Button>
                  )}
                {selectedOrder.paymentMethodValue === 'razorpay' &&
                  selectedOrder.paymentStatus === 'Paid' &&
                  !selectedOrder.razorpayRefundId && (
                    <Button
                      size="compact"
                      variant="outline"
                      className="text-red-600"
                      disabled={updating}
                      onClick={() => setOrderToRefund(selectedOrder)}
                    >
                      Refund online payment
                    </Button>
                  )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold">Customer</h3>
              <p className="mt-2 text-sm text-text-secondary">
                {selectedOrder.customer?.name || 'Customer'}
                {selectedOrder.customer?.email ? ` · ${selectedOrder.customer.email}` : ''}
                {selectedOrder.customer?.phone ? ` · ${selectedOrder.customer.phone}` : ''}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold">Items</h3>
              <div className="mt-3 space-y-3">
                {selectedOrder.items.map((item) => (
                  <div key={item.productId} className="flex items-center gap-3">
                    <img src={item.image} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-text-secondary">
                        {item.sku ? `${item.sku} · ` : ''}{item.quantity} × {item.unit}
                      </p>
                    </div>
                    <p className="shrink-0 whitespace-nowrap text-sm font-semibold">
                      {formatCurrency(item.lineTotal ?? item.price * item.quantity)}
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
              {selectedOrder.deliveryDate && (
                <p className="mt-2 text-xs text-text-secondary">
                  Date: {selectedOrder.deliveryDate}
                </p>
              )}
              {selectedOrder.deliverySlot && (
                <p className="mt-1 text-xs text-text-secondary">
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
              <h3 className="text-sm font-semibold">Status history &amp; notes</h3>
              <ol className="mt-3 space-y-2">
                {(selectedOrder.statusEvents?.length
                  ? selectedOrder.statusEvents
                  : selectedOrder.timeline
                ).map((step, index) => (
                  <li key={`${step.label}-${step.date || index}`} className="rounded-lg bg-app-background p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-text-primary">{step.label}</span>
                      <span className="text-xs text-text-secondary">{step.date}</span>
                    </div>
                    {step.note && <p className="mt-1 text-xs text-text-secondary">Note: {step.note}</p>}
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
        message={`${orderToCancel?.orderNumber || orderToCancel?.id || 'This order'} will be marked cancelled and its stock restored. A paid online order must be refunded before cancellation; cash orders are marked as requiring cash return.`}
        confirmLabel="Cancel order"
      />

      <ConfirmDialog
        open={Boolean(orderToRefund)}
        onClose={() => setOrderToRefund(null)}
        onConfirm={() => handleRefund(orderToRefund)}
        title="Refund this online payment?"
        message={`${orderToRefund?.orderNumber || orderToRefund?.id || 'This order'} will be refunded through Razorpay. This cannot be undone.`}
        confirmLabel="Process refund"
      />
    </>
  )
}
