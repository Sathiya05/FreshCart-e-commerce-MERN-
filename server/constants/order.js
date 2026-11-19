export const ORDER_STATUSES = [
  'Pending',
  'Processing',
  'Packed',
  'Shipped',
  'Out for delivery',
  'Delivered',
  'Cancelled',
]

export const ORDER_FLOW = [
  { status: 'Pending', label: 'Order placed' },
  { status: 'Processing', label: 'Confirmed' },
  { status: 'Packed', label: 'Packed' },
  { status: 'Shipped', label: 'Shipped' },
  { status: 'Out for delivery', label: 'Out for delivery' },
  { status: 'Delivered', label: 'Delivered' },
]

export const ORDER_STATUS_LABELS = {
  Pending: 'Order placed',
  Processing: 'Confirmed',
  Packed: 'Packed',
  Shipped: 'Shipped',
  'Out for delivery': 'Out for delivery',
  Delivered: 'Delivered',
  Cancelled: 'Cancelled',
}
