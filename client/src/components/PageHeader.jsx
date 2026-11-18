import Breadcrumbs from './Breadcrumbs.jsx'

export default function PageHeader({ title, description, breadcrumbs = [], actions }) {
  return (
    <div className="border-b border-app-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumbs items={breadcrumbs} />
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
              {title}
            </h1>
            {description && (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      </div>
    </div>
  )
}
