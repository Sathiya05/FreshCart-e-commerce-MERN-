import mongoose from 'mongoose'

const { Schema } = mongoose

const whatsappMessageSchema = new Schema(
  {
    // Meta message IDs are unique and are used to deduplicate webhook retries.
    messageId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    from: { type: String, required: true, index: true, trim: true },
    text: { type: String, default: '', trim: true },
    replyMessageId: { type: String, default: '', trim: true },
    status: {
      type: String,
      enum: ['processing', 'replied', 'failed', 'ignored'],
      default: 'processing',
      index: true,
    },
    error: { type: String, default: '' },
  },
  { timestamps: true },
)

whatsappMessageSchema.index({ createdAt: 1 })

export const WhatsAppMessage = mongoose.model(
  'WhatsAppMessage',
  whatsappMessageSchema,
)
