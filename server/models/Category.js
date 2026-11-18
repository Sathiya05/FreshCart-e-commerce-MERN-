import mongoose from 'mongoose'
import { slugify } from '../utils/slugify.js'

const { Schema } = mongoose

const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
      minlength: [2, 'Category name must be at least 2 characters'],
      maxlength: [80, 'Category name cannot exceed 80 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Category slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    image: { type: String, trim: true },
    isActive: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
)

categorySchema.pre('validate', function () {
  if (!this.slug || this.isModified('name')) {
    this.slug = slugify(this.name)
  }
})

categorySchema.index({ sortOrder: 1, name: 1 })

export const Category = mongoose.model('Category', categorySchema)
