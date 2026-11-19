import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAppDispatch } from '../redux/hooks.js'
import { pushToast } from '../redux/uiSlice.js'
import { getAdminOverview, getAdminProducts } from '../services/admin.service.js'
import { getAdminOrders } from '../services/commerce.service.js'
import { formatCurrency } from '../utils/format.js'

const STORAGE_KEY = 'freshcart-admin-seen-notifications'
const POLL_INTERVAL = 60_000

const readSeen = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return new Set(Array.isArray(stored) ? stored : [])
  } catch {
    return new Set()
  }
}

const writeSeen = (ids) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids].slice(-200)))
  } catch {
    // Storage can be unavailable in private browsing; notifications still work.
  }
}

const buildNotifications = (overview, products, orders) => {
  const alerts = []

  for (const order of orders.filter((item) => item.status === 'Pending').slice(0, 4)) {
    alerts.push({
      id: `order-${order.id}-${order.status}-${order.paymentStatus}`,
      kind: 'order',
      tone: 'info',
      title: 'Order needs attention',
      message: `${order.orderNumber} · ${formatCurrency(order.totalAmount)} · ${order.paymentStatus || 'Pending payment'}`,
      to: '/admin/orders',
    })
  }

  for (const order of orders.filter((item) => item.paymentStatus === 'Failed').slice(0, 3)) {
    alerts.push({
      id: `payment-${order.id}-${order.paymentStatus}`,
      kind: 'payment',
      tone: 'danger',
      title: 'Payment failed',
      message: `${order.orderNumber} could not be captured. Review and retry.`,
      to: '/admin/orders',
    })
  }

  for (const product of products.filter((item) => item.stock === 0).slice(0, 3)) {
    alerts.push({
      id: `stockout-${product.id}`,
      kind: 'stock',
      tone: 'danger',
      title: 'Out of stock',
      message: `${product.name} is unavailable in the storefront.`,
      to: '/admin/inventory',
    })
  }

  for (const product of products.filter((item) => item.stock > 0 && item.stock <= 20).slice(0, 3)) {
    alerts.push({
      id: `lowstock-${product.id}-${product.stock <= 5 ? 'critical' : 'low'}`,
      kind: 'stock',
      tone: 'warning',
      title: 'Low stock',
      message: `${product.name} has only ${product.stock} units left.`,
      to: '/admin/inventory',
    })
  }

  if (products.length === 0 && overview) {
    if (overview.outOfStock > 0) {
      alerts.push({
        id: 'stockout-summary',
        kind: 'stock',
        tone: 'danger',
        title: 'Out of stock items',
        message: `${overview.outOfStock} products are unavailable in the storefront.`,
        to: '/admin/inventory',
      })
    }
    if (overview.lowStock > 0) {
      alerts.push({
        id: 'lowstock-summary',
        kind: 'stock',
        tone: 'warning',
        title: 'Low stock items',
        message: `${overview.lowStock} products are running low.`,
        to: '/admin/inventory',
      })
    }
  }

  return alerts.slice(0, 8)
}

export default function useAdminNotifications() {
  const dispatch = useAppDispatch()
  const [notifications, setNotifications] = useState([])
  const [seen, setSeen] = useState(readSeen)
  const [loading, setLoading] = useState(true)
  const firstLoad = useRef(true)
  const previousIds = useRef(new Set())

  const refresh = useCallback(async () => {
    setLoading(true)

    const [overviewResult, productsResult, ordersResult] = await Promise.allSettled([
      getAdminOverview(),
      getAdminProducts(),
      getAdminOrders({ limit: 12 }),
    ])

    const overview = overviewResult.status === 'fulfilled' ? overviewResult.value : null
    const products = productsResult.status === 'fulfilled' ? productsResult.value.items : []
    const orders = ordersResult.status === 'fulfilled' ? ordersResult.value.items : []

    const next = buildNotifications(overview, products, orders)
    setNotifications(next)
    setLoading(false)

    const ids = new Set(next.map((item) => item.id))
    if (firstLoad.current) {
      firstLoad.current = false
    } else {
      next
        .filter((item) => !previousIds.current.has(item.id))
        .slice(0, 3)
        .forEach((item) => {
          dispatch(
            pushToast({
              type: item.tone === 'danger' ? 'error' : 'info',
              title: 'Admin alert',
              message: item.message,
            }),
          )
        })
    }
    previousIds.current = ids
  }, [dispatch])

  useEffect(() => {
    refresh()
    const timer = setInterval(refresh, POLL_INTERVAL)
    return () => clearInterval(timer)
  }, [refresh])

  const unreadCount = useMemo(
    () => notifications.filter((item) => !seen.has(item.id)).length,
    [notifications, seen],
  )

  const markAllRead = useCallback(() => {
    setSeen((current) => {
      const next = new Set(current)
      notifications.forEach((item) => next.add(item.id))
      writeSeen(next)
      return next
    })
  }, [notifications])

  return { notifications, seen, unreadCount, loading, refresh, markAllRead }
}
