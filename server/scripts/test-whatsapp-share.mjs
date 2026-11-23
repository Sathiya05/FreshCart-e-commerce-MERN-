import assert from 'node:assert/strict'

const utilsUrl = new URL('../../client/src/utils/whatsapp.js', import.meta.url).href
const {
  FRESH_CART_WHATSAPP_PHONE,
  buildWhatsAppCartMessage,
  buildWhatsAppCartUrl,
  normalizeWhatsAppPhone,
  resolveWhatsAppPhone,
} = await import(utilsUrl)

const cart = {
  items: [
    {
      product: { name: 'Amul Milk', discountPrice: 70, price: 75 },
      quantity: 2,
    },
    {
      product: { name: 'Bananas', price: 45 },
      quantity: 1,
    },
  ],
  subtotal: 185,
  deliveryFee: 30,
  total: 215,
}

const message = buildWhatsAppCartMessage(cart)
assert.match(message, /Amul Milk × 2 — ₹70 each = ₹140/)
assert.match(message, /Bananas × 1 — ₹45 each = ₹45/)
assert.match(message, /Cart total: ₹215/)
assert.doesNotMatch(message, /Delivery details:/)

const deliveryMessage = buildWhatsAppCartMessage({
  ...cart,
  delivery: {
    date: '2026-11-24',
    timeSlot: '8:00 AM – 10:00 AM',
    address: {
      fullName: 'Jane Doe',
      addressLine: '12 Main Street',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
    },
    instructions: 'Leave at the door.',
  },
})
assert.match(deliveryMessage, /Date: 2026-11-24/)
assert.match(deliveryMessage, /Time slot: 8:00 AM – 10:00 AM/)
assert.match(deliveryMessage, /Address: Jane Doe, 12 Main Street, Bengaluru, Karnataka, 560001/)
assert.match(deliveryMessage, /Instructions: Leave at the door\./)

assert.equal(FRESH_CART_WHATSAPP_PHONE, '7812841311')
assert.equal(normalizeWhatsAppPhone('7812841311'), '917812841311')
assert.equal(normalizeWhatsAppPhone('+91 78128 41311'), '917812841311')
assert.equal(resolveWhatsAppPhone(undefined), '917812841311')
assert.equal(resolveWhatsAppPhone(''), '917812841311')
assert.equal(resolveWhatsAppPhone('91 98765 43210'), '919876543210')

const url = buildWhatsAppCartUrl('91 98765 43210', cart)
assert.ok(url.startsWith('https://wa.me/919876543210?text='))
assert.ok(
  buildWhatsAppCartUrl('7812841311', cart).startsWith('https://wa.me/917812841311?text='),
)
const encoded = url.split('?text=')[1]
assert.equal(encoded, encodeURIComponent(message))
assert.equal(decodeURIComponent(encoded), message)
assert.equal(buildWhatsAppCartUrl('919876543210', { items: [], total: 0 }), '')
assert.equal(buildWhatsAppCartUrl('', cart), '')

console.log('WhatsApp Share Cart formatting and encoding checks passed.')
