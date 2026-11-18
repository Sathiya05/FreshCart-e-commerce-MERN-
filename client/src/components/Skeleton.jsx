export function SkeletonLine({ className = '' }) {
  return <div className={`animate-pulse rounded-md bg-app-border/70 ${className}`} />
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-app-border bg-surface p-3">
      <SkeletonLine className="aspect-[4/3] w-full rounded-xl" />
      <div className="space-y-3 px-1 py-4">
        <SkeletonLine className="h-3 w-20" />
        <SkeletonLine className="h-4 w-full" />
        <SkeletonLine className="h-4 w-2/3" />
        <SkeletonLine className="h-6 w-28" />
        <SkeletonLine className="h-10 w-full rounded-xl" />
      </div>
    </div>
  )
}

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  )
}

export function TableSkeleton({ rows = 5, columns = 5 }) {
  return (
    <div className="overflow-hidden rounded-xl border border-app-border bg-surface">
      <div className="grid border-b border-app-border bg-app-background/60 p-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {Array.from({ length: columns }, (_, index) => (
          <SkeletonLine key={index} className="h-3 w-20" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={rowIndex} className="grid border-b border-app-border p-4 last:border-0" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }, (_, index) => (
            <SkeletonLine key={index} className="h-4 w-3/4" />
          ))}
        </div>
      ))}
    </div>
  )
}
