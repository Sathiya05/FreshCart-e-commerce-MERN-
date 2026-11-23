export const FREE_DELIVERY_THRESHOLD = 499
export const DELIVERY_FEE = 30
export const DELIVERY_DAYS_AHEAD = 7
export const INSTANT_DELIVERY_SLOT_ID = 'instant-2030'
export const INSTANT_DELIVERY_ETA = '20–30 min'

export const DELIVERY_TIME_SLOTS = Object.freeze([
  { id: '0800-1000', label: '8:00 AM – 10:00 AM' },
  { id: '1000-1200', label: '10:00 AM – 12:00 PM' },
  { id: '1200-1400', label: '12:00 PM – 2:00 PM' },
  { id: '1600-1800', label: '4:00 PM – 6:00 PM' },
  { id: '1800-2000', label: '6:00 PM – 8:00 PM' },
])

const pad = (value) => String(value).padStart(2, '0')

export const toDeliveryDateKey = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

const addDays = (date, days) => {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

export const isDeliveryDateKey = (value) => {
  const text = String(value || '')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false
  const [year, month, day] = text.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}

export const isDeliveryDateAllowed = (value, now = new Date()) => {
  if (!isDeliveryDateKey(value)) return false

  const todayKey = toDeliveryDateKey(now)
  // Today is allowed only because listDeliverySlots() exposes a single instant
  // slot for today. findDeliverySlot() still validates the exact slot value.
  if (value < todayKey) return false

  const lastAllowedKey = toDeliveryDateKey(addDays(now, DELIVERY_DAYS_AHEAD))
  return value <= lastAllowedKey
}

/** Server-owned delivery options. No client-supplied slot is trusted. */
export const listDeliverySlots = (now = new Date()) => {
  const todayKey = toDeliveryDateKey(now)
  const instantSlot = {
    id: INSTANT_DELIVERY_SLOT_ID,
    date: todayKey,
    dateLabel: 'Today',
    timeSlotId: 'instant',
    timeSlot: `In ${INSTANT_DELIVERY_ETA}`,
    label: `Today, in ${INSTANT_DELIVERY_ETA}`,
    eta: INSTANT_DELIVERY_ETA,
    isExpress: true,
    available: true,
  }
  const slots = [instantSlot]

  for (let day = 1; day <= DELIVERY_DAYS_AHEAD; day += 1) {
    const date = addDays(now, day)
    const dateKey = toDeliveryDateKey(date)
    const dayLabel = date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    })

    for (const time of DELIVERY_TIME_SLOTS) {
      slots.push({
        id: `${dateKey}-${time.id}`,
        date: dateKey,
        dateLabel: dayLabel,
        timeSlotId: time.id,
        timeSlot: time.label,
        label: `${dayLabel}, ${time.label}`,
        available: true,
      })
    }
  }

  return slots
}

export const findDeliverySlot = (date, slotValue, now = new Date()) => {
  if (!isDeliveryDateAllowed(date, now)) return null

  const normalized = String(slotValue || '').trim().toLowerCase()
  if (!normalized) return null

  return (
    listDeliverySlots(now).find(
      (slot) =>
        slot.date === date &&
        [
          slot.id.toLowerCase(),
          slot.timeSlotId.toLowerCase(),
          slot.timeSlot.toLowerCase(),
          slot.label.toLowerCase(),
        ].includes(normalized),
    ) || null
  )
}
