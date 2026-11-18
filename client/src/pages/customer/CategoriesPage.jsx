import CategoryCard from '../../components/CategoryCard.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import { SkeletonLine } from '../../components/Skeleton.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { getCategories } from '../../services/catalog.service.js'

export default function CategoriesPage() {
  const { status, data, error, refetch } = useAsync(getCategories, [])

  return (
    <>
      <PageHeader
        title="Shop by category"
        description="Find fresh produce, dairy, bakery items and pantry staples in a few clicks."
        breadcrumbs={[{ label: 'Categories' }]}
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {status === 'loading' && (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index} className="rounded-2xl border border-app-border bg-surface p-3">
                <SkeletonLine className="h-32 w-full rounded-xl" />
                <SkeletonLine className="mt-4 h-4 w-2/3" />
                <SkeletonLine className="mt-3 h-3 w-full" />
              </div>
            ))}
          </div>
        )}
        {status === 'error' && <ErrorState message={error} onRetry={refetch} />}
        {status === 'success' && data.length === 0 && (
          <EmptyState title="No categories available" description="Categories will appear here once they are configured." />
        )}
        {status === 'success' && data.length > 0 && (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {data.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
