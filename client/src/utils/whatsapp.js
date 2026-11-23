import { formatCurrency } from './format.js'

const clean = (value) => String(value || '').replace(/\s+/g, ' ').trim()

const formatAddress = (address) => {
  if (!address) return ''
  if (typeof address === 'string') return clean(address)

  return clean(
    [
      address.fullName,
      address.addressLine,
      address.city,
      address.state,
      address.pincode,
    ]
      .filter(Boolean)
      .join(', '),
  )
}

/** Plain text only; the customer presses Send in WhatsApp. */
export const buildWhatsAppCartMessage = ({
  items = [],
  subtotal = 0,
  deliveryFee = 0,
  total = 0,
  delivery = {},
} = {}) => {
  if (!items.length) return ''

  const lines = ['Hi FreshCart! Please confirm my cart order.', '']

  items.forEach((item, index) => {
    const name = clean(item.product?.name || item.name)
    const quantity = Number(item.quantity) || 0
    const unitPrice =
      item.product?.discountPrice ||
      item.product?.price ||
      item.unitPrice ||
      item.price ||
      0
    const lineTotal = quantity * unitPrice
    lines.push(
      `${index + 1}. ${name} × ${quantity} — ${formatCurrency(unitPrice)} each = ${formatCurrency(lineTotal)}`,
    )
  })

  lines.push('', `Subtotal: ${formatCurrency(subtotal)}`)
  lines.push(`Delivery: ${Number(deliveryFee) > 0 ? formatCurrency(deliveryFee) : 'FREE'}`)
  lines.push(`Cart total: ${formatCurrency(total)}`)

  const date = clean(delivery?.date || delivery?.dateLabel)
  const timeSlot = clean(delivery?.timeSlot || delivery?.slot || delivery?.label)
  const address = formatAddress(delivery?.address)
  const instructions = clean(delivery?.instructions || delivery?.deliveryInstructions)

  if (date || timeSlot || address || instructions) {
    lines.push('', 'Delivery details:')
    if (date) lines.push(`Date: ${date}`)
    if (timeSlot) lines.push(`Time slot: ${timeSlot}`)
    if (address) lines.push(`Address: ${address}`)
    if (instructions) lines.push(`Instructions: ${instructions}`)
  }

  lines.push('', 'Please confirm availability and next steps. Thank you!')
  return lines.join('\n')
}

/** Public business number. Safe to expose; env config still takes precedence. */
export const FRESH_CART_WHATSAPP_PHONE = '7812841311'

/** FreshCart is India-only, so a 10-digit mobile number gets the +91 prefix. */
export const normalizeWhatsAppPhone = (value) => {
  const digits = String(value || '').replace(/\D/g, '')
  if (!digits) return ''
  return digits.length === 10 ? `91${digits}` : digits
}

/** Use configured number when present, otherwise the built-in public number. */
export const resolveWhatsAppPhone = (value) =>
  normalizeWhatsAppPhone(value) || normalizeWhatsAppPhone(FRESH_CART_WHATSAPP_PHONE)

export const buildWhatsAppCartUrl = (phone, cart) => {
  const digits = normalizeWhatsAppPhone(phone)
  const message = buildWhatsAppCartMessage(cart)
  if (!digits || !message) return ''

  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}
