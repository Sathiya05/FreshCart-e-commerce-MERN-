import { Coupon } from '../models/Coupon.js'
import { Order } from '../models/Order.js'
import { Review } from '../models/Review.js'
import { Setting } from '../models/Setting.js'
import { User } from '../models/User.js'
import { ApiError } from '../utils/apiError.js'

const isoDate = (value) =>
  value instanceof Date && !Number.isNaN(value.getTime())
    ? value.toISOString().slice(0, 10)
    : value
      ? new Date(value).toISOString().slice(0, 10)
      : ''

const requireDoc = (doc, label) => {
  if (!doc) throw new ApiError(404, `${label} not found.`, 'NOT_FOUND')
  return doc
}

const serializeCoupon = (coupon) => ({
  id: String(coupon._id || coupon.id),
  code: coupon.code,
  discountType: coupon.discountType,
  discountValue: coupon.discountValue,
  minimumOrderAmount: coupon.minimumOrderAmount || 0,
  maximumDiscount: coupon.maximumDiscount || 0,
  expiryDate: isoDate(coupon.expiryDate),
  usageLimit: coupon.usageLimit || 0,
  usedCount: coupon.usedCount || 0,
  isActive: coupon.isActive,
})

const serializeReview = (review) => ({
  id: String(review._id || review.id),
  productId: String(review.product?._id || review.product || ''),
  productName: review.product?.name || 'Removed product',
  userId: String(review.user?._id || review.user || ''),
  userName: review.user?.name || 'Customer',
  rating: review.rating,
  comment: review.comment,
  status: review.status,
  date: isoDate(review.createdAt),
})

const settingKeys = [
  'storeName',
  'supportEmail',
  'supportPhone',
  'currency',
  'freeDeliveryAbove',
  'defaultDeliveryFee',
  'lowStockThreshold',
  'orderNotifications',
  'lowStockAlerts',
  'weeklySummary',
]

const defaultSettings = {
  storeName: 'FreshCart',
  supportEmail: 'support@freshcart.example',
  supportPhone: '',
  currency: 'INR',
  freeDeliveryAbove: 999,
  defaultDeliveryFee: 30,
  lowStockThreshold: 20,
  orderNotifications: true,
  lowStockAlerts: true,
  weeklySummary: false,
}

const serializeSettings = (settings) => {
  const result = { id: String(settings._id || 'store') }
  settingKeys.forEach((key) => {
    result[key] = settings[key]
  })
  return result
}

export const listAdminCustomers = async () => {
  const [users, orderStats] = await Promise.all([
    User.find({ role: 'customer' })
      .select('name email phone isActive createdAt')
      .sort({ createdAt: -1 })
      .lean(),
    Order.aggregate([
      {
        $group: {
          _id: '$user',
          orders: { $sum: 1 },
          spent: {
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
    ]),
  ])

  const stats = new Map(orderStats.map((row) => [String(row._id), row]))

  return users.map((user) => {
    const row = stats.get(String(user._id)) || {}
    return {
      id: String(user._id),
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      orders: row.orders || 0,
      spent: row.spent || 0,
      joined: isoDate(user.createdAt),
      status: user.isActive ? 'Active' : 'Inactive',
    }
  })
}

export const setCustomerActive = async (id, isActive) => {
  const user = requireDoc(
    await User.findOne({ _id: id, role: 'customer' }),
    'Customer',
  )
  user.isActive = isActive
  user.tokenVersion = (user.tokenVersion || 0) + 1
  await user.save()
  return { id: String(user._id), isActive: user.isActive }
}

const couponPayload = (body) => ({
  code: String(body.code || '').trim().toUpperCase(),
  discountType: body.discountType,
  discountValue: Number(body.discountValue),
  minimumOrderAmount: Number(body.minimumOrderAmount) || 0,
  maximumDiscount: Number(body.maximumDiscount) || 0,
  expiryDate: new Date(`${String(body.expiryDate).slice(0, 10)}T23:59:59.999Z`),
  usageLimit: Number(body.usageLimit) || 0,
  isActive: body.isActive !== false,
})

export const listAdminCoupons = async () => {
  const coupons = await Coupon.find().sort({ createdAt: -1 }).lean()
  return coupons.map(serializeCoupon)
}

export const createAdminCoupon = async (body) => {
  const coupon = await Coupon.create(couponPayload(body))
  return serializeCoupon(coupon)
}

export const updateAdminCoupon = async (id, body) => {
  const coupon = requireDoc(await Coupon.findByIdAndUpdate(id, couponPayload(body), {
    returnDocument: 'after',
    runValidators: true,
  }), 'Coupon')
  return serializeCoupon(coupon)
}

export const setCouponActive = async (id, isActive) => {
  const coupon = requireDoc(
    await Coupon.findByIdAndUpdate(id, { isActive }, { returnDocument: 'after' }),
    'Coupon',
  )
  return serializeCoupon(coupon)
}

export const deleteAdminCoupon = async (id) => {
  requireDoc(await Coupon.findByIdAndDelete(id), 'Coupon')
  return { id: String(id) }
}

export const listAdminReviews = async () => {
  const reviews = await Review.find()
    .populate('product', 'name')
    .populate('user', 'name')
    .sort({ createdAt: -1 })
    .lean()
  return reviews.map(serializeReview)
}

export const setReviewStatus = async (id, status) => {
  const review = requireDoc(
    await Review.findByIdAndUpdate(id, { status }, { returnDocument: 'after' })
      .populate('product', 'name')
      .populate('user', 'name'),
    'Review',
  )
  return serializeReview(review)
}

export const deleteAdminReview = async (id) => {
  requireDoc(await Review.findByIdAndDelete(id), 'Review')
  return { id: String(id) }
}

export const getStoreSettings = async () => {
  const settings = await Setting.findOneAndUpdate(
    { key: 'store' },
    { $setOnInsert: { key: 'store', ...defaultSettings } },
    { returnDocument: 'after', upsert: true },
  ).lean()
  return serializeSettings(settings)
}

export const updateStoreSettings = async (body) => {
  const update = {}
  settingKeys.forEach((key) => {
    if (body[key] !== undefined) update[key] = body[key]
  })

  // MongoDB rejects a path that appears in both $set and $setOnInsert. When the
  // document already exists, repeating every default in $setOnInsert produced
  // "Updating the path 'storeName' would create a conflict" (code 40) -> HTTP 500.
  // Only insert the defaults for fields this request is not updating.
  const onInsert = { key: 'store' }
  settingKeys.forEach((key) => {
    if (update[key] === undefined) onInsert[key] = defaultSettings[key]
  })

  const settings = await Setting.findOneAndUpdate(
    { key: 'store' },
    { $set: update, $setOnInsert: onInsert },
    { returnDocument: 'after', upsert: true, runValidators: true },
  ).lean()
  return serializeSettings(settings)
}
