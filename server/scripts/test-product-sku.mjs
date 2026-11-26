import assert from 'node:assert/strict'
import mongoose from 'mongoose'
import app from '../server.js'
import { connectDatabase } from '../config/database.js'
import { Category } from '../models/Category.js'
import { Product } from '../models/Product.js'
import { getHighestProductSkuNumber } from '../services/sku.service.js'

const stamp = Date.now()
const testNames = [0, 1, 2].map((index) => `SKU workflow test ${stamp} ${index}`)
const missingSkuName = `SKU workflow missing ${stamp}`

const requestJson = async (url, options = {}) => {
  const response = await fetch(url, options)
  const body = await response.json()
  return { response, body }
}

const run = async () => {
  const connected = await connectDatabase()
  assert.equal(connected, true, 'MongoDB is required for the SKU workflow test.')

  const category = await Category.findOne({ isActive: true })
    .sort({ sortOrder: 1, name: 1 })
    .lean()
  assert.ok(category, 'Create an active category before running this test.')

  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  assert.ok(email && password, 'ADMIN_EMAIL and ADMIN_PASSWORD must be set in server/.env.')

  const server = await new Promise((resolve) => {
    const listener = app.listen(0, () => resolve(listener))
  })
  const base = `http://127.0.0.1:${server.address().port}`
  let missingSku = null

  try {
    const { response: loginResponse, body: loginBody } = await requestJson(
      `${base}/api/auth/login`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      },
    )
    assert.equal(loginResponse.status, 200, JSON.stringify(loginBody.error))
    assert.equal(loginBody.data.user.role, 'admin')

    const cookies = (loginResponse.headers.getSetCookie?.() || [])
      .map((cookie) => cookie.split(';')[0])
      .join('; ')
    assert.ok(cookies, 'Admin login did not return session cookies.')

    // A legacy product with no SKU must be ignored, not renumbered.
    missingSku = await Product.create({
      name: missingSkuName,
      category: category._id,
      price: 10,
      stock: 1,
      unit: 'pcs',
      images: ['https://example.com/sku-test.jpg'],
    })

    const existingSample = await Product.findOne({ sku: { $regex: /^FC-P-\d+$/ } }).lean()
    const maxBefore = await getHighestProductSkuNumber()

    const createProduct = (name, extra = {}) =>
      requestJson(`${base}/api/admin/products`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: cookies },
        body: JSON.stringify({
          name,
          category: String(category._id),
          price: 10,
          stock: 1,
          unit: 'pcs',
          images: ['https://example.com/sku-test.jpg'],
          ...extra,
        }),
      }).then(({ response, body }) => {
        assert.equal(response.status, 201, JSON.stringify(body.error))
        return body.data
      })

    // Concurrent creation must produce unique sequential SKUs. The first request
    // also sends a client SKU to prove the server ignores it.
    const created = await Promise.all([
      createProduct(testNames[0], { sku: 'CUSTOM-SKU' }),
      createProduct(testNames[1]),
      createProduct(testNames[2]),
    ])

    const skus = created.map((product) => product.sku)
    assert.ok(skus.every((sku) => /^FC-P-\d{3,}$/.test(sku)), `Unexpected SKUs: ${skus}`)
    assert.equal(new Set(skus).size, 3, 'Concurrent creations produced duplicate SKUs.')
    assert.notEqual(created[0].sku, 'CUSTOM-SKU', 'Client-supplied SKU must be ignored.')

    const numbers = skus.map((sku) => Number(sku.slice('FC-P-'.length))).sort((a, b) => a - b)
    assert.deepEqual(
      numbers,
      [maxBefore + 1, maxBefore + 2, maxBefore + 3],
      'SKUs must continue from the highest existing numeric SKU.',
    )

    const persisted = await Product.find({ _id: { $in: created.map((product) => product.id) } })
      .select('sku')
      .lean()
    assert.deepEqual(
      new Set(persisted.map((product) => product.sku)),
      new Set(skus),
      'Generated SKUs were not saved to MongoDB.',
    )

    const missingAfter = await Product.findById(missingSku.id).lean()
    assert.equal(missingAfter.sku, undefined, 'A missing SKU must remain unchanged.')

    if (existingSample) {
      const existingAfter = await Product.findById(existingSample._id).lean()
      assert.equal(
        existingAfter.sku,
        existingSample.sku,
        'An existing SKU must remain unchanged.',
      )
    }

    console.log('Product SKU workflow checks passed.')
  } finally {
    await Product.deleteMany({ name: { $in: [...testNames, missingSkuName] } })
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()))
    })
    await mongoose.disconnect()
  }
}

run().catch((error) => {
  console.error('[test:product-sku]', error)
  process.exitCode = 1
})
