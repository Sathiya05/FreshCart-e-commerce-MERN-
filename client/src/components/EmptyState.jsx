import { Inbox } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from './Button.jsx'

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'Nothing here yet',
  description = 'Try another search or browse our fresh collection.',
  actionLabel,
  actionTo,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-app-border bg-surface px-6 py-14 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-secondary text-brand-dark">
        <Icon size={26} aria-hidden="true" />
      </span>
      <h3 className="mt-5 text-lg font-semibold text-text-primary">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-text-secondary">{description}</p>
      {actionLabel && actionTo && (
        <Button className="mt-6" as={Link} to={actionTo}>
          {actionLabel}
        </Button>
      )}
      {actionLabel && !actionTo && onAction && (
        <Button className="mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
