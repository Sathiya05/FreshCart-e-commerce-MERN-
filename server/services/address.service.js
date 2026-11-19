import { User } from '../models/User.js'
import { ApiError } from '../utils/apiError.js'
import { serializeAddress } from '../utils/serialize.js'

const addressFields = [
  'label',
  'fullName',
  'phone',
  'addressLine',
  'city',
  'state',
  'pincode',
  'isDefault',
]

const loadUser = async (userId) => {
  const user = await User.findById(userId)
  if (!user) throw new ApiError(404, 'Account not found.', 'NOT_FOUND')
  return user
}

const findAddress = (user, addressId) => {
  const address = user.addresses.find(
    (item) => String(item._id) === String(addressId),
  )
  if (!address) throw new ApiError(404, 'Address not found.', 'NOT_FOUND')
  return address
}

const normalizePayload = (payload) => {
  const data = { ...payload }
  if (data.addressType !== undefined && data.label === undefined) {
    data.label = data.addressType
  }
  delete data.addressType
  return data
}

const clearDefaults = (user, exceptId) => {
  user.addresses.forEach((address) => {
    if (String(address._id) !== String(exceptId)) address.isDefault = false
  })
}

export const listAddresses = async (userId) => {
  const user = await loadUser(userId)
  return user.addresses.map(serializeAddress)
}

export const createAddress = async (userId, payload) => {
  const user = await loadUser(userId)
  const data = normalizePayload(payload)
  const shouldDefault = user.addresses.length === 0 || data.isDefault === true

  if (shouldDefault) clearDefaults(user)
  const address = user.addresses.create({
    ...data,
    label: data.label || 'Home',
    isDefault: shouldDefault,
  })
  user.addresses.push(address)
  await user.save()

  return serializeAddress(address)
}

export const updateAddress = async (userId, addressId, payload) => {
  const user = await loadUser(userId)
  const address = findAddress(user, addressId)
  const data = normalizePayload(payload)

  for (const field of addressFields) {
    if (data[field] !== undefined) address[field] = data[field]
  }

  if (data.isDefault === true) {
    clearDefaults(user, address._id)
    address.isDefault = true
  } else if (address.isDefault === false && user.addresses.length > 1) {
    const hasDefault = user.addresses.some((item) => item.isDefault)
    if (!hasDefault) user.addresses[0].isDefault = true
  }

  await user.save()
  return serializeAddress(address)
}

export const deleteAddress = async (userId, addressId) => {
  const user = await loadUser(userId)
  const address = findAddress(user, addressId)
  const wasDefault = address.isDefault

  user.addresses.pull(address._id)
  if (wasDefault && user.addresses.length) {
    user.addresses[0].isDefault = true
  }

  await user.save()
  return { message: 'Address deleted.' }
}

export const setDefaultAddress = async (userId, addressId) => {
  const user = await loadUser(userId)
  const address = findAddress(user, addressId)

  clearDefaults(user, address._id)
  address.isDefault = true
  await user.save()

  return serializeAddress(address)
}
