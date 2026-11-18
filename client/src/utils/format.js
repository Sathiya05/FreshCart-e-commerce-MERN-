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

export const getGalleryImages = (image = '') => {
  if (!image) return []
  const separator = image.includes('?') ? '&' : '?'
  return [
    `${image}${separator}auto=format&fit=crop&w=900&q=85`,
    `${image}${separator}auto=format&fit=crop&w=900&q=85&crop=top`,
    `${image}${separator}auto=format&fit=crop&w=900&q=85&crop=bottom`,
  ]
}

export const truncate = (text = '', length = 90) =>
  text.length > length ? `${text.slice(0, length).trimEnd()}…` : text
