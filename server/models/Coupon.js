import mongoose from 'mongoose'

const { Schema } = mongoose

const couponSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: 40,
    },
    discountType: {
      type: String,
      enum: ['percent', 'fixed'],
      required: true,
    },
    discountValue: { type: Number, required: true, min: 0 },
    minimumOrderAmount: { type: Number, default: 0, min: 0 },
    maximumDiscount: { type: Number, default: 0, min: 0 },
    expiryDate: { type: Date, required: true },
    usageLimit: { type: Number, default: 0, min: 0 },
    usedCount: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
)

export const Coupon = mongoose.model('Coupon', couponSchema)
