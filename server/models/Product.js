import mongoose from 'mongoose'
import { slugify } from '../utils/slugify.js'

const { Schema } = mongoose

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [2, 'Product name must be at least 2 characters'],
      maxlength: [120, 'Product name cannot exceed 120 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Product slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [3000, 'Description cannot exceed 3000 characters'],
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: [200, 'Short description cannot exceed 200 characters'],
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
      index: true,
    },
    brand: { type: String, trim: true, maxlength: 80 },
    sku: {
      type: String,
      trim: true,
      uppercase: true,
      unique: true,
      sparse: true,
      maxlength: 40,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    discountPrice: {
      type: Number,
      min: [0, 'Discount price cannot be negative'],
      validate: {
        validator: function (value) {
          return value === undefined || value === null || value < this.price
        },
        message: 'Discount price must be lower than the regular price',
      },
    },
    stock: { type: Number, default: 0, min: [0, 'Stock cannot be negative'] },
    lowStockThreshold: { type: Number, default: 20, min: 0 },
    unit: { type: String, trim: true, maxlength: 30, default: 'pcs' },
    images: {
      type: [String],
      required: [true, 'At least one image is required'],
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: 'At least one image is required',
      },
    },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    tags: { type: [String], default: [] },
    isActive: { type: Boolean, default: true, index: true },
    featured: { type: Boolean, default: false, index: true },
    bestSeller: { type: Boolean, default: false },
    dailyDeal: { type: Boolean, default: false },
  },
  { timestamps: true },
)

productSchema.pre('validate', function () {
  if (!this.slug || this.isModified('name')) {
    this.slug = slugify(this.name)
  }
})

productSchema.index({ name: 'text', description: 'text', brand: 'text', tags: 'text' })
productSchema.index({ price: 1, rating: -1 })
productSchema.index({ createdAt: -1 })

export const Product = mongoose.model('Product', productSchema)
