import { Check, MapPin, Pencil, Trash2 } from 'lucide-react'
import Badge from './Badge.jsx'
import Button from './Button.jsx'

export default function AddressCard({
  address,
  selected = false,
  onSelect,
  onEdit,
  onDelete,
}) {
  return (
    <div
      className={`rounded-2xl border bg-surface p-5 shadow-sm transition-colors ${
        selected ? 'border-brand-primary ring-2 ring-brand-primary/10' : 'border-app-border'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-secondary text-brand-dark">
            <MapPin size={17} aria-hidden="true" />
          </span>
          <div>
            <p className="font-semibold text-text-primary">{address.fullName}</p>
            <p className="text-xs text-text-secondary">{address.phone}</p>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-1.5">
          <Badge tone="brand">{address.addressType}</Badge>
          {address.isDefault && <Badge tone="success">Default</Badge>}
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-text-secondary">
        {address.addressLine}, {address.city}, {address.state} - {address.pincode}
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {onSelect && (
          <Button
            size="sm"
            variant={selected ? 'secondary' : 'outline'}
            onClick={() => onSelect(address)}
          >
            {selected && <Check size={14} aria-hidden="true" />}
            {selected ? 'Selected' : 'Deliver here'}
          </Button>
        )}
        {onEdit && (
          <Button size="sm" variant="ghost" onClick={() => onEdit(address)}>
            <Pencil size={14} aria-hidden="true" />
            Edit
          </Button>
        )}
        {onDelete && (
          <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => onDelete(address)}>
            <Trash2 size={14} aria-hidden="true" />
            Delete
          </Button>
        )}
      </div>
    </div>
  )
}
