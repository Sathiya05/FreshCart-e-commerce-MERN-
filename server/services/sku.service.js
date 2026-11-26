import { Product } from '../models/Product.js'

const SKU_PREFIX = 'FC-P-'
const SKU_PATTERN = /^FC-P-(\d+)$/
const MAX_CREATE_ATTEMPTS = 8

const parseSkuNumber = (sku) => {
  const match = SKU_PATTERN.exec(String(sku || ''))
  if (!match) return 0

  const number = Number(match[1])
  return Number.isSafeInteger(number) && number >= 0 ? number : 0
}

export const formatProductSku = (number) =>
  `${SKU_PREFIX}${String(number).padStart(3, '0')}`

/**
 * Highest numeric SKU currently stored on a product. Missing, malformed or
 * non-numeric SKUs are ignored so legacy products cannot block generation.
 */
export const getHighestProductSkuNumber = async () => {
  const products = await Product.find({ sku: { $regex: SKU_PATTERN } })
    .select('sku')
    .lean()

  return products.reduce(
    (highest, product) => Math.max(highest, parseSkuNumber(product.sku)),
    0,
  )
}

const isSkuDuplicateError = (error) =>
  error?.code === 11000 &&
  Boolean(error?.keyPattern?.sku || (error?.keyValue && 'sku' in error.keyValue))

/**
 * Creates a product with the next sequential SKU. The unique index on
 * Product.sku is the final guard: if two admins create products at the same
 * time and both read the same highest SKU, the loser retries with the new
 * highest value instead of returning a duplicate.
 */
export const createProductWithGeneratedSku = async (fields = {}) => {
  const { sku: _ignoredSku, ...safeFields } = fields

  for (let attempt = 0; attempt < MAX_CREATE_ATTEMPTS; attempt += 1) {
    const nextNumber = (await getHighestProductSkuNumber()) + 1

    try {
      return await Product.create({
        ...safeFields,
        sku: formatProductSku(nextNumber),
      })
    } catch (error) {
      if (!isSkuDuplicateError(error) || attempt === MAX_CREATE_ATTEMPTS - 1) {
        throw error
      }
    }
  }
}
