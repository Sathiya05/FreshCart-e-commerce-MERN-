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
    note: { type: String, trim: true },
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
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    deliveryFee: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    deliverySlot: { type: String, trim: true },
    deliveryInstructions: { type: String, trim: true, maxlength: 200 },
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

export const Order = mongoose.model('Order', orderSchema)
