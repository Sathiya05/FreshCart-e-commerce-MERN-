const toPlainObject = (value) =>
  value && typeof value.toObject === 'function'
    ? value.toObject({ virtuals: true })
    : value

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
