import assert from 'node:assert/strict'
import {
  DELIVERY_DAYS_AHEAD,
  DELIVERY_TIME_SLOTS,
  INSTANT_DELIVERY_SLOT_ID,
  findDeliverySlot,
  isDeliveryDateAllowed,
  listDeliverySlots,
  toDeliveryDateKey,
} from '../constants/delivery.js'

const now = new Date(2026, 10, 23, 12, 0, 0)
const today = toDeliveryDateKey(now)
const yesterdayDate = new Date(now)
yesterdayDate.setDate(yesterdayDate.getDate() - 1)
const yesterday = toDeliveryDateKey(yesterdayDate)

const slots = listDeliverySlots(now)
assert.equal(slots.length, 1 + DELIVERY_DAYS_AHEAD * DELIVERY_TIME_SLOTS.length)
assert.equal(slots[0].id, INSTANT_DELIVERY_SLOT_ID)
assert.equal(slots[0].date, today)
assert.equal(slots[0].isExpress, true)
assert.equal(slots[0].timeSlot, 'In 20–30 min')
assert.ok(slots.slice(1).every((slot) => slot.date > today && !slot.isExpress))

assert.ok(isDeliveryDateAllowed(today, now))
assert.equal(isDeliveryDateAllowed(yesterday, now), false)

const instant = findDeliverySlot(today, INSTANT_DELIVERY_SLOT_ID, now)
assert.equal(instant?.isExpress, true)
assert.ok(
  findDeliverySlot(today, slots[0].label, now),
  'The instant label must also be accepted by the validator',
)
assert.equal(
  findDeliverySlot(today, '8:00 AM – 10:00 AM', now),
  null,
  'Scheduled slots must not be valid for today',
)

console.log('Instant delivery slot checks passed.')
