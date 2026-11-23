import { DELIVERY_DAYS_AHEAD, DELIVERY_FEE, FREE_DELIVERY_THRESHOLD } from '../constants/delivery.js'
import { env } from '../config/env.js'
import { Setting } from '../models/Setting.js'

const formatMoney = (value) => `₹${Number(value || 0).toFixed(2)}`

const isRealSupportEmail = (value) => {
  const email = String(value || '').trim().toLowerCase()
  return Boolean(email) && !/^support@freshcart\.(example|demo|local)$/.test(email)
}

/** Store facts come from MongoDB settings when available, with safe local fallbacks. */
export const getStoreFaqFacts = async () => {
  let setting = null
  try {
    setting = await Setting.findOne({}).lean()
  } catch (error) {
    console.warn('[faq] Store settings unavailable:', error?.message || error)
  }

  const supportEmail = isRealSupportEmail(setting?.supportEmail)
    ? String(setting.supportEmail).trim()
    : ''

  const facts = [
    {
      topic: 'shopping',
      answer:
        'FreshCart shows live catalog prices in INR. Your cart and checkout recalculate the final total from the current catalog before an order is placed.',
    },
    {
      topic: 'delivery',
      answer: `Delivery dates and time slots are selected at checkout from FreshCart's live schedule, up to ${DELIVERY_DAYS_AHEAD} days ahead and subject to availability. Free delivery applies when the cart subtotal is ${formatMoney(FREE_DELIVERY_THRESHOLD)} or more; otherwise a ${formatMoney(DELIVERY_FEE)} delivery fee is added. Your delivery address, date, time slot and any instructions are saved with the order.`,
    },
    {
      topic: 'payments',
      answer: env.razorpayConfigured
        ? 'Cash on delivery is available. Razorpay-powered UPI, card and net-banking payments are available at checkout when enabled, and payments are verified on the server before the order is marked paid. FreshCart does not store card details.'
        : 'Cash on delivery is available. Online UPI, card and net-banking payments are not enabled for this store right now.',
    },
    {
      topic: 'orders',
      answer:
        'After checkout, signed-in customers can view order status and details in the My Orders area. Order information in chat is read-only and only shown for the signed-in customer. FreshCart cannot place orders, take payments or change an address from chat.',
    },
    {
      topic: 'support',
      answer: supportEmail
        ? `For questions not covered here, contact FreshCart support at ${supportEmail}.`
        : 'For questions not covered here, use the Contact Support page on FreshCart, or contact FreshCart support. I cannot confirm details that are not in the store information.',
    },
  ]

  return { ok: true, facts }
}
