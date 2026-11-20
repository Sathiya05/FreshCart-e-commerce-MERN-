import mongoose from 'mongoose'

const { Schema } = mongoose

const settingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    storeName: { type: String, default: 'FreshCart' },
    supportEmail: { type: String, default: 'support@freshcart.example' },
    supportPhone: { type: String, default: '' },
    currency: { type: String, default: 'INR' },
    freeDeliveryAbove: { type: Number, default: 999, min: 0 },
    defaultDeliveryFee: { type: Number, default: 30, min: 0 },
    lowStockThreshold: { type: Number, default: 20, min: 1 },
    orderNotifications: { type: Boolean, default: true },
    lowStockAlerts: { type: Boolean, default: true },
    weeklySummary: { type: Boolean, default: false },
  },
  { timestamps: true },
)

export const Setting = mongoose.model('Setting', settingSchema)
