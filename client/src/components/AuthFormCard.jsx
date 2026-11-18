export default function AuthFormCard({ eyebrow, title, description, children, footer }) {
  return (
    <div className="rounded-2xl border border-app-border bg-surface p-7 shadow-sm sm:p-8">
      {eyebrow && (
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-primary">
          {eyebrow}
        </p>
      )}
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-text-primary">{title}</h1>
      {description && <p className="mt-2 text-sm leading-6 text-text-secondary">{description}</p>}
      <div className="mt-7">{children}</div>
      {footer && <div className="mt-6 border-t border-app-border pt-5 text-sm text-text-secondary">{footer}</div>}
    </div>
  )
}
