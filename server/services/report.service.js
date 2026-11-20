import { Order } from '../models/Order.js'
import { serializeOrder } from '../utils/serialize.js'

const paidOnly = { paymentStatus: 'Paid', status: { $ne: 'Cancelled' } }

const numberOrZero = (value) => Number(value) || 0

const startOfUtcDay = (date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))

export const getOrderStats = async () => {
  const [rows] = await Order.aggregate([
    {
      $group: {
        _id: null,
        orders: { $sum: 1 },
        paidOrders: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'Paid'] }, 1, 0] },
        },
        pendingPayment: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$paymentStatus', 'Pending'] },
                  { $eq: ['$paymentMethod', 'razorpay'] },
                ],
              },
              1,
              0,
            ],
          },
        },
        failedPayments: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'Failed'] }, 1, 0] },
        },
        revenue: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$paymentStatus', 'Paid'] },
                  { $ne: ['$status', 'Cancelled'] },
                ],
              },
              '$totalAmount',
              0,
            ],
          },
        },
      },
    },
  ])

  return {
    orders: numberOrZero(rows?.orders),
    paidOrders: numberOrZero(rows?.paidOrders),
    pendingPayment: numberOrZero(rows?.pendingPayment),
    failedPayments: numberOrZero(rows?.failedPayments),
    revenue: numberOrZero(rows?.revenue),
  }
}

export const getRecentOrders = async (limit = 5) => {
  const rows = await Order.find()
    .populate({ path: 'user', select: 'name email' })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()
  return rows.map(serializeOrder)
}

export const getAdminSalesReport = async () => {
  const now = new Date()
  const today = startOfUtcDay(now)
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6)

  const [summaryRows, dailyRows, statusRows, productRows, recentRows] =
    await Promise.all([
      Order.aggregate([
        {
          $group: {
            _id: null,
            orders: { $sum: 1 },
            paidOrders: {
              $sum: { $cond: [{ $eq: ['$paymentStatus', 'Paid'] }, 1, 0] },
            },
            revenue: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$paymentStatus', 'Paid'] },
                      { $ne: ['$status', 'Cancelled'] },
                    ],
                  },
                  '$totalAmount',
                  0,
                ],
              },
            },
            todayRevenue: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$paymentStatus', 'Paid'] },
                      { $ne: ['$status', 'Cancelled'] },
                      { $gte: ['$createdAt', today] },
                    ],
                  },
                  '$totalAmount',
                  0,
                ],
              },
            },
            weekRevenue: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$paymentStatus', 'Paid'] },
                      { $ne: ['$status', 'Cancelled'] },
                      { $gte: ['$createdAt', sevenDaysAgo] },
                    ],
                  },
                  '$totalAmount',
                  0,
                ],
              },
            },
          },
        },
      ]),
      Order.aggregate([
        { $match: { ...paidOnly, createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$totalAmount' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Order.aggregate([
        { $match: paidOnly },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.name',
            units: { $sum: '$items.quantity' },
            revenue: { $sum: '$items.lineTotal' },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
        { $project: { _id: 0, name: '$_id', units: 1, revenue: 1 } },
      ]),
      getRecentOrders(8),
    ])

  const summary = summaryRows[0] || {}
  const revenue = numberOrZero(summary.revenue)
  const paidOrders = numberOrZero(summary.paidOrders)
  const byDate = new Map(dailyRows.map((row) => [row._id, row]))

  const revenueByDay = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(sevenDaysAgo)
    day.setUTCDate(day.getUTCDate() + index)
    const key = day.toISOString().slice(0, 10)
    return {
      date: key,
      revenue: numberOrZero(byDate.get(key)?.revenue),
      orders: numberOrZero(byDate.get(key)?.orders),
    }
  })

  return {
    orders: numberOrZero(summary.orders),
    paidOrders,
    pendingPayment: (await getOrderStats()).pendingPayment,
    revenue,
    todayRevenue: numberOrZero(summary.todayRevenue),
    weekRevenue: numberOrZero(summary.weekRevenue),
    averageOrderValue: paidOrders ? Math.round((revenue / paidOrders) * 100) / 100 : 0,
    revenueByDay,
    statusCounts: statusRows.map((row) => ({ status: row._id, count: row.count })),
    topProducts: productRows,
    recentOrders: recentRows,
  }
}
