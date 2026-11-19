import { ORDER_FLOW } from '../constants/order.js'

const toPlainObject = (value) =>
  value && typeof value.toObject === 'function'
    ? value.toObject({ virtuals: true })
    : value

const toId = (value) => {
  if (!value) return ''
  if (typeof value === 'object') return String(value._id || value.id || '')
  return String(value)
}

export const serializeUser = (user) => {
  const plain = toPlainObject(user)
  const { password, tokenVersion, _id, __v, ...safe } = plain
  return {
    ...safe,
    id: safe.id || String(_id),
  }
}

const serializeCategoryRef = (value) => {
  if (!value) return null
  const plain = toPlainObject(value)
  return {
    id: plain.id || String(plain._id),
    name: plain.name || '',
    slug: plain.slug || '',
    isActive: plain.isActive,
  }
}

export const serializeCategory = (category) => {
  const plain = toPlainObject(category)
  const { __v, ...rest } = plain
  return {
    ...rest,
    id: rest.id || String(rest._id),
  }
}

export const serializeProduct = (product) => {
  const plain = toPlainObject(product)
  const { _id, __v, categoryDoc, category: rawCategory, ...rest } = plain
  const category = serializeCategoryRef(categoryDoc || rawCategory)

  return {
    ...rest,
    id: rest.id || String(_id),
    effectivePrice: rest.discountPrice || rest.price,
    category: category?.id || String(rawCategory || ''),
    categoryId: category?.id || String(rawCategory || ''),
    categoryName: category?.name || '',
    categorySlug: category?.slug || '',
  }
}

export const serializeAddress = (address) => {
  if (!address) return null
  const plain = toPlainObject(address)
  const { _id, id, __v, createdAt, updatedAt, label, addressType, ...rest } = plain
  const resolvedLabel = addressType || label || 'Home'

  return {
    ...rest,
    id: id || String(_id),
    label: resolvedLabel,
    addressType: resolvedLabel,
  }
}

export const serializeCartItem = (item) => {
  const plain = toPlainObject(item)
  if (!plain?.product) return null

  const product = serializeProduct(plain.product)
  const unitPrice = product.effectivePrice || product.price || 0
  const quantity = Number(plain.quantity) || 1

  return {
    product,
    quantity,
    unitPrice,
    lineTotal: unitPrice * quantity,
  }
}

export const serializeCart = (cart) => {
  const plain = toPlainObject(cart)
  const items = (plain?.items || []).map(serializeCartItem).filter(Boolean)

  return {
    ...plain,
    items,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    subtotal: items.reduce((total, item) => total + item.lineTotal, 0),
  }
}

export const serializeOrderItem = (item) => {
  const plain = toPlainObject(item)
  const { _id, __v, product, ...rest } = plain
  const productId = toId(product)

  return {
    ...rest,
    id: productId || String(_id),
    productId,
    image: rest.image || '',
    unit: rest.unit || 'pcs',
    quantity: Number(rest.quantity) || 1,
    price: Number(rest.price) || 0,
    lineTotal: Number(rest.lineTotal) || 0,
  }
}

const buildOrderTimeline = (events = [], status, createdAt) => {
  const dateFor = (eventStatus) =>
    events.find((event) => event.status === eventStatus)?.date || null

  if (status === 'Cancelled') {
    return [
      {
        label: 'Order placed',
        date: dateFor('Pending') || createdAt || null,
        complete: true,
      },
      {
        label: 'Cancelled',
        date: dateFor('Cancelled') || null,
        complete: true,
      },
    ]
  }

  const currentIndex = ORDER_FLOW.findIndex((step) => step.status === status)

  return ORDER_FLOW.map((step, index) => ({
    label: step.label,
    date: dateFor(step.status) || (index === 0 ? createdAt || null : null),
    complete: currentIndex >= 0 ? index <= currentIndex : index === 0,
  }))
}

export const serializeOrder = (order) => {
  const plain = toPlainObject(order)
  const {
    _id,
    __v,
    user,
    customer,
    items = [],
    shippingAddress,
    timeline = [],
    deliveryFee = 0,
    razorpaySignature,
    ...rest
  } = plain
  const address = serializeAddress(shippingAddress)
  const customerDoc =
    customer || (user && typeof user === 'object' ? user : null)

  return {
    ...rest,
    id: rest.id || String(_id),
    user: toId(user),
    customer: customerDoc
      ? {
          id: toId(customerDoc),
          name: customerDoc.name || '',
          email: customerDoc.email || '',
        }
      : null,
    items: items.map(serializeOrderItem),
    itemCount: items.reduce((total, item) => total + (Number(item.quantity) || 0), 0),
    address,
    shippingAddress: address,
    deliveryFee,
    deliveryCharge: deliveryFee,
    date: rest.createdAt || null,
    timeline: buildOrderTimeline(timeline, rest.status, rest.createdAt),
  }
}
