import mongoose from 'mongoose'

const { Schema } = mongoose

const usedConfirmationTokenSchema = new Schema(
  {
    jti: { type: String, required: true, unique: true, trim: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
)

// MongoDB removes consumed tokens after they can no longer be redeemed.
usedConfirmationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const UsedConfirmationToken = mongoose.model(
  'UsedConfirmationToken',
  usedConfirmationTokenSchema,
)
