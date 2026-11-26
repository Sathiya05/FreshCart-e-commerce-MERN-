import assert from 'node:assert/strict'
import mongoose from 'mongoose'
import app from '../server.js'
import { connectDatabase } from '../config/database.js'
import { Cart } from '../models/Cart.js'
import { Category } from '../models/Category.js'
import { Order } from '../models/Order.js'
import { Product } from '../models/Product.js'
import { User } from '../models/User.js'
import { removePurchasedItemsFromCart } from '../services/cart.service.js'

const stamp = Date.now()
const email = `order-test-${stamp}@example.com`
const idempotencyKey = `order-test-${stamp}`
const productNames = [
  `Order lifecycle test A ${stamp}`,
  `Order lifecycle test B ${stamp}`,
]

const requestJson = async (url, options = {}) => {
  const response = await fetch(url, options)
  const body = await response.json()
  return { response, body }
}

const run = async () => {
  const connected = await connectDatabase()
  assert.equal(connected, true, 'MongoDB is required for this workflow test.')
  await Order.init()
  const indexes = await Order.collection.indexes()
  const idempotencyIndex = indexes.find(
    (index) => index.key?.user === 1 && index.key?.idempotencyKey === 1,
  )
  assert.ok(
    idempotencyIndex?.unique &&
      (idempotencyIndex?.sparse || idempotencyIndex?.partialFilterExpression),
    'The unique idempotency index on (user, idempotencyKey) is missing.',
  )

  const category = await Category.findOne({ isActive: true })
    .sort({ sortOrder: 1, name: 1 })
    .lean()
  assert.ok(category, 'Create an active category before running this test.')

  assert.ok(
    process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD,
    'ADMIN_EMAIL and ADMIN_PASSWORD must be set in server/.env.',
  )

  const listener = await new Promise((resolve) => {
    const server = app.listen(0, () => resolve(server))
  })
  const base = `http://127.0.0.1:${listener.address().port}`
  let customerId = null

  const api = async (path, { method = 'GET', cookies = '', body } = {}) =>
    requestJson(`${base}${path}`, {
      method,
      headers: {
        'content-type': 'application/json',
        ...(cookies ? { cookie: cookies } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })

  const asCookies = (response) =>
    (response.headers.getSetCookie?.() || [])
      .map((cookie) => cookie.split(';')[0])
      .join('; ')

  try {
    const { response: adminLogin, body: adminBody } = await api('/api/auth/login', {
      method: 'POST',
      body: { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD },
    })
    assert.equal(adminLogin.status, 200, JSON.stringify(adminBody.error))
    const adminCookies = asCookies(adminLogin)
    assert.ok(adminCookies, 'Admin login did not return session cookies.')

    const { response: signup, body: signupBody } = await api('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Order Test Customer',
        email,
        password: 'OrderTest@2026!',
        phone: '9000000000',
      },
    })
    assert.equal(signup.status, 201, JSON.stringify(signupBody.error))
    customerId = signupBody.data.user.id
    const customerCookies = asCookies(signup)
    assert.ok(customerCookies, 'Customer registration did not return session cookies.')

    const products = []
    for (const name of productNames) {
      const { response, body } = await api('/api/admin/products', {
        method: 'POST',
        cookies: adminCookies,
        body: {
          name,
          category: String(category._id),
          price: 120,
          stock: 6,
          unit: 'pcs',
          images: ['https://example.com/order-lifecycle.jpg'],
        },
      })
      assert.equal(response.status, 201, JSON.stringify(body.error))
      products.push(body.data)
    }

    const { response: addressResponse, body: addressBody } = await api(
      '/api/account/addresses',
      {
        method: 'POST',
        cookies: customerCookies,
        body: {
          fullName: 'Order Test Customer',
          phone: '9000000000',
          addressLine: '1 Test Street',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001',
          isDefault: true,
        },
      },
    )
    assert.equal(addressResponse.status, 201, JSON.stringify(addressBody.error))
    const addressId = addressBody.data.id

    const { body: secondAddressBody } = await api('/api/account/addresses', {
      method: 'POST',
      cookies: customerCookies,
      body: {
        fullName: 'Second Address',
        phone: '9000000000',
        addressLine: '2 Test Street',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560002',
      },
    })

    for (const product of products) {
      const { response, body } = await api('/api/cart/items', {
        method: 'POST',
        cookies: customerCookies,
        body: { productId: product.id, quantity: 2 },
      })
      assert.equal(response.status, 200, JSON.stringify(body.error))
    }

    const { body: slotsBody } = await api('/api/delivery/slots')
    const slot = slotsBody.data.slots[0]

    const checkoutPayload = {
      addressId,
      paymentMethod: 'cod',
      deliveryDate: slot.date,
      deliverySlot: slot.label,
      deliveryInstructions: 'Leave at the door',
      addressConfirmed: true,
      idempotencyKey,
    }

    // A double-click sends two concurrent requests with the same key.
    const [first, second] = await Promise.all([
      api('/api/orders', {
        method: 'POST',
        cookies: customerCookies,
        body: checkoutPayload,
      }),
      api('/api/orders', {
        method: 'POST',
        cookies: customerCookies,
        body: checkoutPayload,
      }),
    ])
    assert.equal(first.response.status, 201, JSON.stringify(first.body.error))
    assert.equal(second.response.status, 201, JSON.stringify(second.body.error))
    assert.equal(
      first.body.data.id,
      second.body.data.id,
      'Idempotency key returned two different orders.',
    )
    const orderId = first.body.data.id
    assert.equal(
      await Order.countDocuments({ idempotencyKey }),
      1,
      'Double submit created duplicate orders.',
    )
    assert.equal(first.body.data.paymentStatus, 'Pending')
    assert.equal(first.body.data.paymentMethod, 'cod')

    const { response: reuseResponse, body: reuseBody } = await api('/api/orders', {
      method: 'POST',
      cookies: customerCookies,
      body: { ...checkoutPayload, addressId: secondAddressBody.data.id },
    })
    assert.equal(reuseResponse.status, 409, JSON.stringify(reuseBody))
    assert.equal(reuseBody.error.code, 'IDEMPOTENCY_KEY_REUSE')

    const { body: cartAfterOrder } = await api('/api/cart', { cookies: customerCookies })
    assert.equal(cartAfterOrder.data.items.length, 0)

    // Even though checkout uses the whole cart, the removal helper must leave
    // items that are not part of the confirmed order untouched.
    await Cart.updateOne(
      { user: customerId },
      {
        $set: {
          items: products.map((product) => ({ product: product.id, quantity: 1 })),
        },
      },
    )
    await removePurchasedItemsFromCart(customerId, [
      { product: products[0].id, quantity: 1 },
    ])
    const mixedCart = await Cart.findOne({ user: customerId }).lean()
    assert.equal(mixedCart.items.length, 1)
    assert.equal(String(mixedCart.items[0].product), products[1].id)

    const { body: searchBody } = await api(
      `/api/admin/orders?q=${encodeURIComponent(first.body.data.orderNumber)}&status=Pending&paymentMethod=cod`,
      { cookies: adminCookies },
    )
    assert.equal(
      searchBody.data.items.some((order) => order.id === orderId),
      true,
      'Admin search/filter did not find the new order.',
    )

    for (const status of ['Processing', 'Packed', 'Shipped', 'Out for delivery']) {
      const { response, body } = await api(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        cookies: adminCookies,
        body: { status, note: `Internal note for ${status}` },
      })
      assert.equal(response.status, 200, JSON.stringify(body.error))
    }

    const { body: deliveredBeforeCash } = await api(`/api/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      cookies: adminCookies,
      body: { status: 'Delivered' },
    })
    assert.equal(deliveredBeforeCash.data.paymentStatus, 'Pending')

    const { response: invalidResponse } = await api(`/api/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      cookies: adminCookies,
      body: { status: 'Processing' },
    })
    assert.equal(invalidResponse.status, 409, 'Invalid transition was accepted.')

    const { response: cashResponse, body: cashBody } = await api(
      `/api/admin/orders/${orderId}/confirm-cod-payment`,
      { method: 'PATCH', cookies: adminCookies },
    )
    assert.equal(cashResponse.status, 200, JSON.stringify(cashBody.error))
    assert.equal(cashBody.data.paymentStatus, 'Paid')
    assert.ok(cashBody.data.paymentConfirmedAt)

    const { body: trackingBody } = await api(`/api/orders/${orderId}/track`, {
      cookies: customerCookies,
    })
    assert.equal(trackingBody.data.paymentStatus, 'Paid')
    assert.ok(trackingBody.data.timeline.length >= 5)
    assert.ok(
      trackingBody.data.timeline.every((step) => !('note' in step)),
      'Internal admin notes leaked to customer tracking.',
    )

    const { body: adminOrderBody } = await api(`/api/admin/orders/${orderId}`, {
      cookies: adminCookies,
    })
    assert.ok(
      adminOrderBody.data.statusEvents.some((event) =>
        String(event.note || '').includes('Internal note'),
      ),
      'Admin status history lost its internal notes.',
    )
  } finally {
    await Order.deleteMany({ idempotencyKey })
    if (customerId) {
      await Cart.deleteMany({ user: customerId })
      await User.deleteOne({ _id: customerId })
    }
    await Product.deleteMany({ name: { $in: productNames } })
    await new Promise((resolve) => {
      listener.closeAllConnections?.()
      listener.close(resolve)
    })
    await mongoose.disconnect()
  }

  console.log('Order lifecycle workflow checks passed.')
}

run().catch(async (error) => {
  console.error(error)
  try {
    await mongoose.disconnect()
  } catch {
    // Already disconnected.
  }
  process.exit(1)
})
