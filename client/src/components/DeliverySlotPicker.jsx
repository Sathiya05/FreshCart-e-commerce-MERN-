import { CalendarClock, Check } from 'lucide-react'

export default function DeliverySlotPicker({ slots = [], selectedId, onSelect }) {
  if (!slots.length) {
    return <p className="text-sm text-text-secondary">No delivery slots are available.</p>
  }

  const groups = slots.reduce((result, slot) => {
    const day = slot.dateLabel || 'Available dates'
    result[day] = [...(result[day] || []), slot]
    return result
  }, {})

  return (
    <div className="space-y-5">
      {Object.entries(groups).map(([day, daySlots]) => (
        <div key={day}>
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
            <CalendarClock size={14} aria-hidden="true" />
            {day}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {daySlots.map((slot) => {
              const selected = selectedId === slot.id
              return (
                <button
                  key={slot.id}
                  type="button"
                  disabled={!slot.available}
                  onClick={() => onSelect(slot)}
                  className={`flex items-center justify-between gap-3 rounded-xl border p-4 text-left transition-colors ${
                    selected
                      ? 'border-brand-primary bg-brand-secondary/50 ring-2 ring-brand-primary/10'
                      : 'border-app-border bg-surface hover:border-brand-primary/50'
                  } ${!slot.available ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                        selected
                          ? 'border-brand-primary bg-brand-primary text-white'
                          : 'border-app-border'
                      }`}
                    >
                      {selected && <Check size={12} aria-hidden="true" />}
                    </span>
                    <span>
                      <span className="block text-sm font-medium text-text-primary">
                        {slot.timeSlot || slot.label}
                      </span>
                      <span className="text-xs text-text-secondary">
                        {slot.available ? 'Available' : 'Fully booked'}
                      </span>
                    </span>
                  </span>
                  <span className="text-sm font-semibold text-text-primary">
                    {slot.fee ? `₹${slot.fee}` : 'FREE'}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
