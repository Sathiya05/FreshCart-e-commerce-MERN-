import { useEffect, useMemo, useState } from 'react'
import { Check, Search, Trash2, X } from 'lucide-react'
import AdminPageHeader from '../../components/AdminPageHeader.jsx'
import Badge from '../../components/Badge.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import DataTable from '../../components/DataTable.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import Rating from '../../components/Rating.jsx'
import { TableSkeleton } from '../../components/Skeleton.jsx'
import { useAppDispatch } from '../../redux/hooks.js'
import { pushToast } from '../../redux/uiSlice.js'
import { useAsync } from '../../hooks/useAsync.js'
import {
  deleteAdminReview,
  getAdminReviews,
  setAdminReviewStatus,
} from '../../services/admin.service.js'

const statusTone = {
  approved: 'success',
  pending: 'warning',
  rejected: 'danger',
}

export default function AdminReviewsPage() {
  const dispatch = useAppDispatch()
  const { status, data, error, refetch } = useAsync(getAdminReviews, [])
  const [reviews, setReviews] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [reviewToDelete, setReviewToDelete] = useState(null)

  useEffect(() => {
    if (data) setReviews(data)
  }, [data])

  const filtered = useMemo(
    () =>
      reviews.filter((review) => {
        const matchesSearch =
          review.productName.toLowerCase().includes(search.toLowerCase()) ||
          review.userName.toLowerCase().includes(search.toLowerCase())
        const matchesStatus = statusFilter === 'all' || review.status === statusFilter
        return matchesSearch && matchesStatus
      }),
    [reviews, search, statusFilter],
  )

  const updateStatus = async (review, nextStatus) => {
    try {
      const saved = await setAdminReviewStatus(review.id, nextStatus)
      setReviews((current) =>
        current.map((item) => (item.id === review.id ? saved : item)),
      )
      dispatch(pushToast({
        title: 'Review updated',
        message: `${review.userName}'s review is now ${nextStatus}.`,
      }))
    } catch (error) {
      dispatch(pushToast({
        type: 'error',
        title: 'Update failed',
        message: error?.message || 'Could not update this review.',
      }))
    }
  }

  const columns = [
    {
      key: 'product',
      label: 'Product',
      render: (row) => <p className="font-medium text-text-primary">{row.productName}</p>,
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (row) => (
        <div>
          <p className="font-medium text-text-primary">{row.userName}</p>
          <p className="text-xs text-text-secondary">{row.date}</p>
        </div>
      ),
    },
    {
      key: 'rating',
      label: 'Rating',
      render: (row) => <Rating value={row.rating} showValue={false} />,
    },
    {
      key: 'comment',
      label: 'Comment',
      render: (row) => (
        <span className="block max-w-full break-words text-text-secondary sm:truncate" title={row.comment}>
          {row.comment}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge tone={statusTone[row.status] || 'neutral'}>
          {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-1">
          {row.status !== 'approved' && (
            <button
              type="button"
              onClick={() => updateStatus(row, 'approved')}
              className="inline-flex h-11 min-w-11 items-center justify-center rounded-lg text-brand-primary hover:bg-brand-secondary"
              aria-label={`Approve review from ${row.userName}`}
              title="Approve"
            >
              <Check size={16} aria-hidden="true" />
            </button>
          )}
          {row.status !== 'rejected' && (
            <button
              type="button"
              onClick={() => updateStatus(row, 'rejected')}
              className="inline-flex h-11 min-w-11 items-center justify-center rounded-lg text-amber-700 hover:bg-amber-50"
              aria-label={`Reject review from ${row.userName}`}
              title="Reject"
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setReviewToDelete(row)}
            className="inline-flex h-11 min-w-11 items-center justify-center rounded-lg text-text-secondary hover:bg-red-50 hover:text-red-600"
            aria-label={`Delete review from ${row.userName}`}
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
        title="Reviews"
        description="Customer reviews stored in FreshCart, with live moderation."
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search product or customer…"
            aria-label="Search reviews"
            className="h-11 w-full rounded-xl border border-app-border bg-surface pl-9 pr-3 text-sm outline-none focus:border-brand-primary"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter reviews by status"
          className="h-11 rounded-xl border border-app-border bg-surface px-3 text-sm outline-none focus:border-brand-primary"
        >
          <option value="all">All reviews</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {status === 'loading' && <TableSkeleton rows={5} columns={6} />}
      {status === 'error' && <ErrorState message={error} onRetry={refetch} />}
      {status === 'success' && (
        <DataTable columns={columns} rows={filtered} emptyMessage="No reviews match your filters." />
      )}

      <ConfirmDialog
        open={Boolean(reviewToDelete)}
        onClose={() => setReviewToDelete(null)}
        onConfirm={async () => {
          try {
            await deleteAdminReview(reviewToDelete.id)
            setReviews((current) => current.filter((review) => review.id !== reviewToDelete.id))
            dispatch(pushToast({ type: 'info', message: 'Review deleted.' }))
          } catch (error) {
            dispatch(pushToast({
              type: 'error',
              title: 'Delete failed',
              message: error?.message || 'Could not delete this review.',
            }))
          }
        }}
        title="Delete this review?"
        message={`The review from ${reviewToDelete?.userName || 'this customer'} will be permanently removed.`}
        confirmLabel="Delete review"
      />

      <div className="mt-5 text-xs text-text-secondary">
        Approve, reject or delete reviews. Changes are saved immediately through the API.
      </div>
    </>
  )
}
