import { useEffect, useMemo, useState } from 'react'
import { Check, Clock3 } from 'lucide-react'
import { formatCurrency } from '../utils/format.js'

const dayLabelParts = (label, index, isExpress = false) => {
  if (isExpress) return { title: 'Instant', subtitle: '20–30 min' }

  const parts = String(label || '')
    .replace(/,/g, '')
    .split(/\s+/)
    .filter(Boolean)

  return {
    title: index === 0 ? 'Tomorrow' : parts[0] || `Day ${index + 1}`,
    subtitle: parts.slice(1).join(' ') || 'Available',
  }
}

export default function DeliverySlotPicker({ slots = [], selectedId, onSelect }) {
  const days = useMemo(() => {
    const grouped = new Map()

    slots.forEach((slot) => {
      const key = slot.isExpress ? 'instant' : slot.date || slot.dateLabel || 'available'
      if (!grouped.has(key)) {
        grouped.set(key, {
          key,
          label: slot.isExpress ? 'Instant delivery' : slot.dateLabel || 'Available dates',
          isExpress: Boolean(slot.isExpress),
          slots: [],
        })
      }
      grouped.get(key).slots.push(slot)
    })

    return [...grouped.values()]
  }, [slots])

  const selectedDayKey = useMemo(() => {
    const slot = slots.find((item) => item.id === selectedId)
    if (!slot) return ''
    return slot.isExpress ? 'instant' : slot.date || slot.dateLabel || ''
  }, [slots, selectedId])
  const [activeDate, setActiveDate] = useState(() => selectedDayKey || days[0]?.key || '')

  useEffect(() => {
    if (selectedDayKey) setActiveDate(selectedDayKey)
  }, [selectedDayKey])

  useEffect(() => {
    if (!days.length) {
      if (activeDate) setActiveDate('')
      return
    }
    if (!days.some((day) => day.key === activeDate)) {
      setActiveDate(selectedDayKey || days[0].key)
    }
  }, [activeDate, days, selectedDayKey])

  if (!days.length) {
    return <p className="text-sm text-text-secondary">No delivery slots are available.</p>
  }

  const activeDay = days.find((day) => day.key === activeDate) || days[0]

  return (
    <div className="space-y-4">
      <div
        className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2"
        role="tablist"
        aria-label="Delivery dates"
      >
        {days.map((day, index) => {
          const { title, subtitle } = dayLabelParts(day.label, index, day.isExpress)
          const active = day.key === activeDay.key
          const hasSelectedSlot = day.slots.some((slot) => slot.id === selectedId)

          return (
            <button
              key={day.key}
              id={`slot-tab-${day.key}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls="delivery-time-panel"
              onClick={() => setActiveDate(day.key)}
              className={`relative min-w-[92px] shrink-0 rounded-xl border px-3 py-2 text-left transition-colors ${
                active
                  ? 'border-brand-primary bg-brand-secondary/60 ring-2 ring-brand-primary/10'
                  : 'border-app-border bg-surface hover:border-brand-primary/50'
              }`}
            >
              <span className="block text-sm font-semibold text-text-primary">{title}</span>
              <span className="block text-xs text-text-secondary">{subtitle}</span>
              {hasSelectedSlot && (
                <span className="absolute right-1.5 top-1.5 grid h-4 w-4 place-items-center rounded-full bg-brand-primary text-white">
                  <Check size={10} aria-hidden="true" />
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div
        id="delivery-time-panel"
        role="tabpanel"
        aria-labelledby={`slot-tab-${activeDay.key}`}
        aria-label={activeDay.label}
      >
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
            <Clock3 size={14} aria-hidden="true" />
            {activeDay.label}
          </p>
          <p className="text-xs text-text-secondary">
            {activeDay.slots.length} time slot{activeDay.slots.length === 1 ? '' : 's'}
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          {activeDay.slots.map((slot) => {
            const selected = slot.id === selectedId

            return (
              <button
                key={slot.id}
                type="button"
                disabled={!slot.available}
                aria-pressed={selected}
                onClick={() => onSelect(slot)}
                className={`relative rounded-xl border px-3 py-3 text-left transition-colors ${
                  selected
                    ? 'border-brand-primary bg-brand-secondary/60 ring-2 ring-brand-primary/10'
                    : 'border-app-border bg-surface hover:border-brand-primary/50'
                } ${!slot.available ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                <span className="block pr-5 text-sm font-semibold text-text-primary">
                  {slot.timeSlot || slot.label}
                </span>
                <span className="mt-1 block text-xs text-text-secondary">
                  {!slot.available
                    ? 'Fully booked'
                    : slot.fee
                      ? formatCurrency(slot.fee)
                      : 'FREE'}
                </span>
                {selected && (
                  <span className="absolute right-2.5 top-3 grid h-5 w-5 place-items-center rounded-full bg-brand-primary text-white">
                    <Check size={12} aria-hidden="true" />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
