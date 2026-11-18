import { Link, useSearchParams } from 'react-router-dom'
import EmptyState from '../../components/EmptyState.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import ProductGrid from '../../components/ProductGrid.jsx'
import { ProductGridSkeleton } from '../../components/Skeleton.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { getProducts } from '../../services/catalog.service.js'

const suggestions = ['tomatoes', 'milk', 'bread', 'rice', 'bananas', 'coffee']

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''

  const { status, data, error, refetch } = useAsync(
    () => getProducts({ q: query, limit: 12 }),
    [query],
  )

  return (
    <>
      <PageHeader
        title={query ? `Results for “${query}”` : 'Search products'}
        description="Find groceries by name, category, brand or description."
        breadcrumbs={[{ label: 'Search' }]}
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {!query && (
          <EmptyState
            title="Start with a search"
            description="Type a product name in the search bar above, or try one of these popular searches."
            actionLabel="Browse all products"
            actionTo="/shop"
          />
        )}

        {query && status === 'loading' && <ProductGridSkeleton count={8} />}
        {query && status === 'error' && <ErrorState message={error} onRetry={refetch} />}
        {query && status === 'success' && data.items.length === 0 && (
          <EmptyState
            title="No matching products"
            description={`We could not find anything for “${query}”. Check the spelling or try a broader term.`}
            actionLabel="Browse all products"
            actionTo="/shop"
          />
        )}
        {query && status === 'success' && data.items.length > 0 && (
          <>
            <p className="mb-5 text-sm text-text-secondary">
              {data.total} result{data.total === 1 ? '' : 's'} found
            </p>
            <ProductGrid products={data.items} />
          </>
        )}

        <div className="mt-12 rounded-2xl border border-app-border bg-surface p-5">
          <p className="text-sm font-semibold text-text-primary">Popular searches</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestions.map((item) => (
              <Link
                key={item}
                to={`/search?q=${encodeURIComponent(item)}`}
                className="rounded-full border border-app-border px-3 py-1.5 text-sm text-text-secondary hover:border-brand-primary hover:text-brand-primary"
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
