import Badge from './Badge.jsx'

const statusTone = {
  'Out for delivery': 'info',
  Delivered: 'success',
  Cancelled: 'danger',
  Pending: 'warning',
  Processing: 'info',
  Packed: 'brand',
  Shipped: 'info',
}

export default function OrderStatusBadge({ status }) {
  return <Badge tone={statusTone[status] || 'neutral'}>{status}</Badge>
}
