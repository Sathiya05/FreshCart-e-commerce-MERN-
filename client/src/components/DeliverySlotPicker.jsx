import { CalendarClock } from 'lucide-react'

export default function DeliverySlotPicker({ slots = [], selectedId, onSelect }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {slots.map((slot) => {
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
              <CalendarClock size={18} className="text-brand-primary" aria-hidden="true" />
              <span>
                <span className="block text-sm font-medium text-text-primary">{slot.label}</span>
                <span className="text-xs text-text-secondary">
                  {slot.available ? 'Available' : 'Fully booked'}
                </span>
              </span>
            </span>
            <span className="text-sm font-semibold text-text-primary">₹{slot.fee}</span>
          </button>
        )
      })}
    </div>
  )
}
