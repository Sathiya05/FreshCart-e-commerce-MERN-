export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0)

export const formatNumber = (value) =>
  new Intl.NumberFormat('en-IN').format(Number(value) || 0)

export const formatDiscount = (price, discountPrice) => {
  if (!price || !discountPrice || discountPrice >= price) return 0
  return Math.round(((price - discountPrice) / price) * 100)
}

export const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

export const getGalleryImages = (product) => {
  const image = typeof product === 'string' ? product : product?.image || ''
  const extras = Array.isArray(product?.images) ? product.images.filter(Boolean) : []
  const unique = [...new Set([image, ...extras])]
  if (!unique.length) return []

  // Only Unsplash supports query-based transforms. S3/product URLs must be
  // shown as stored, not with meaningless query parameters appended.
  return unique.map((url) =>
    /images\.unsplash\.com/.test(url)
      ? `${url}${url.includes('?') ? '&' : '?'}auto=format&fit=crop&w=900&q=85`
      : url,
  )
}

/** Responsive candidates for Unsplash images; other URLs are served as-is. */
export const getImageSrcSet = (image = '') => {
  if (!/images\.unsplash\.com/.test(image)) return undefined
  const base = image.split('?')[0]
  return [320, 480, 720]
    .map((width) => `${base}?auto=format&fit=crop&w=${width}&q=80 ${width}w`)
    .join(', ')
}

export const truncate = (text = '', length = 90) =>
  text.length > length ? `${text.slice(0, length).trimEnd()}…` : text
