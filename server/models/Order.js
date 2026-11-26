import mongoose from 'mongoose'
import {
  ORDER_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
} from '../constants/order.js'

const { Schema } = mongoose

const orderItemSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: { type: String, required: true, trim: true },
    sku: { type: String, trim: true },
    unit: { type: String, trim: true, default: 'pcs' },
    image: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false },
)

const shippingAddressSchema = new Schema(
  {
    label: { type: String, trim: true, default: 'Home' },
    fullName: { type: String, trim: true },
    phone: { type: String, trim: true },
    addressLine: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true },
  },
  { _id: false },
)

const timelineEventSchema = new Schema(
  {
    status: {
      type: String,
      enum: ORDER_STATUSES,
      required: true,
    },
    label: { type: String, required: true, trim: true },
    date: { type: Date, default: Date.now },
    note: { type: String, trim: true, maxlength: 300 },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false },
)

const orderSchema = new Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    idempotencyKey: { type: String, trim: true },
    // Hash of the checkout request. Reusing a key with different details is
    // rejected instead of silently returning the first order.
    idempotencyHash: { type: String, trim: true },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: 'An order must contain at least one item',
      },
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'Pending',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      default: 'cod',
    },
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: 'Pending',
      index: true,
    },
    paymentProvider: {
      type: String,
      enum: ['razorpay'],
    },
    razorpayOrderId: { type: String, trim: true, index: true },
    razorpayPaymentId: { type: String, trim: true },
    razorpaySignature: { type: String, trim: true },
    paymentFailureReason: { type: String, trim: true },
    paymentAttempts: { type: Number, default: 0, min: 0 },
    paidAt: { type: Date },
    paymentConfirmedAt: { type: Date },
    paymentConfirmedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    razorpayRefundId: { type: String, trim: true },
    razorpayRefundStatus: { type: String, trim: true },
    // Atomic lock so two refund requests cannot reach Razorpay together.
    refundRequestToken: { type: String, trim: true },
    processedWebhookEvents: { type: [String], default: [] },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    deliveryFee: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    deliveryDate: { type: String, trim: true },
    deliverySlot: { type: String, trim: true },
    deliveryInstructions: { type: String, trim: true, maxlength: 200 },
    addressConfirmedAt: { type: Date },
    couponCode: { type: String, trim: true },
    timeline: {
      type: [timelineEventSchema],
      default: [],
    },
  },
  { timestamps: true },
)

orderSchema.index({ user: 1, createdAt: -1 })
orderSchema.index({ createdAt: -1 })
// Sparse indexes still include explicit `null` values, and legacy orders have
// `idempotencyKey: null`. A partial index covers only real string keys, so it
// can be built without modifying a single existing order.
orderSchema.index(
  { user: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } },
)

export const Order = mongoose.model('Order', orderSchema)
