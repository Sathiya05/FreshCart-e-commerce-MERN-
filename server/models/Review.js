import mongoose from 'mongoose'

const { Schema } = mongoose

const reviewSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 2000 },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
  },
  { timestamps: true },
)

reviewSchema.index({ createdAt: -1 })

export const Review = mongoose.model('Review', reviewSchema)
