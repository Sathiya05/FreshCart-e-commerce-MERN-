import { Minus, Plus } from 'lucide-react'

export default function QuantitySelector({ value, onChange, min = 1, max = 99, size = 'md' }) {
  const buttonSize = size === 'sm' ? 'h-10 w-10 sm:h-8 sm:w-8' : 'h-10 w-10'

  return (
    <div className="inline-flex items-center overflow-hidden rounded-xl border border-app-border bg-surface">
      <button
        type="button"
        className={`${buttonSize} grid place-items-center text-text-secondary hover:bg-app-background disabled:opacity-40`}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Decrease quantity"
      >
        <Minus size={14} aria-hidden="true" />
      </button>
      <span className={`${size === 'sm' ? 'w-10 text-sm sm:w-8' : 'w-10'} text-center font-semibold`}>
        {value}
      </span>
      <button
        type="button"
        className={`${buttonSize} grid place-items-center text-text-secondary hover:bg-app-background disabled:opacity-40`}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Increase quantity"
      >
        <Plus size={14} aria-hidden="true" />
      </button>
    </div>
  )
}
