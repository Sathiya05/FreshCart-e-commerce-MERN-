import { useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import EmptyState from '../../components/EmptyState.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import Pagination from '../../components/Pagination.jsx'
import ProductGrid from '../../components/ProductGrid.jsx'
import { ProductGridSkeleton } from '../../components/Skeleton.jsx'
import ShopFilters from '../../components/ShopFilters.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { getCategories, getProducts } from '../../services/catalog.service.js'

const defaultFilters = {
  q: '',
  category: '',
  minPrice: '',
  maxPrice: '',
  availability: 'all',
  sort: 'featured',
  page: 1,
  limit: 8,
}

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const filters = {
    q: searchParams.get('q') || defaultFilters.q,
    category: searchParams.get('category') || defaultFilters.category,
    minPrice: searchParams.get('minPrice') || defaultFilters.minPrice,
    maxPrice: searchParams.get('maxPrice') || defaultFilters.maxPrice,
    availability: searchParams.get('availability') || defaultFilters.availability,
    sort: searchParams.get('sort') || defaultFilters.sort,
    page: Number(searchParams.get('page') || defaultFilters.page),
    limit: defaultFilters.limit,
  }

  const categoriesState = useAsync(getCategories, [])
  const productsState = useAsync(() => getProducts(filters), [
    filters.q,
    filters.category,
    filters.minPrice,
    filters.maxPrice,
    filters.availability,
    filters.sort,
    filters.page,
    filters.limit,
  ])

  const updateFilters = (patch) => {
    const next = new URLSearchParams(searchParams)
    Object.entries(patch).forEach(([key, value]) => {
      if (value === '' || value === null || value === undefined || (key === 'page' && value === 1)) {
        next.delete(key)
      } else {
        next.set(key, String(value))
      }
    })
    if (!('page' in patch)) next.delete('page')
    setSearchParams(next)
  }

  const resetFilters = () => setSearchParams(new URLSearchParams())

  const activeFilterCount = [
    filters.q,
    filters.category,
    filters.minPrice,
    filters.maxPrice,
    filters.availability !== 'all',
  ].filter(Boolean).length

  return (
    <>
      <PageHeader
        title="Shop fresh groceries"
        description="Browse the live catalog, filter by category and price, and find exactly what you need."
        breadcrumbs={[{ label: 'Shop' }]}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between gap-3 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen((value) => !value)}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-app-border bg-surface px-4 text-sm font-semibold"
            aria-expanded={mobileFiltersOpen}
          >
            <SlidersHorizontal size={16} aria-hidden="true" />
            {mobileFiltersOpen ? 'Hide filters' : 'Filters'}
            {activeFilterCount > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand-primary px-1 text-xs text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
          <span className="text-sm text-text-secondary">
            {productsState.data?.total || 0} products
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <div className={`${mobileFiltersOpen ? 'block' : 'hidden'} lg:block`}>
            <ShopFilters
              filters={filters}
              categories={categoriesState.data || []}
              onChange={updateFilters}
              onReset={resetFilters}
              onApply={() => setMobileFiltersOpen(false)}
              resultCount={productsState.data?.total || 0}
            />
          </div>

          <div>
            <div className="mb-5 hidden items-center justify-between gap-4 lg:flex">
              <p className="text-sm text-text-secondary">
                Showing{' '}
                <span className="font-semibold text-text-primary">
                  {productsState.data?.items?.length || 0}
                </span>{' '}
                of {productsState.data?.total || 0} products
              </p>
              <div className="flex items-center gap-2 text-sm">
                <label htmlFor="shop-sort" className="text-text-secondary">Sort:</label>
                <select
                  id="shop-sort"
                  value={filters.sort}
                  onChange={(event) => updateFilters({ sort: event.target.value })}
                  className="h-10 rounded-xl border border-app-border bg-surface px-3 outline-none focus:border-brand-primary"
                >
                  <option value="featured">Featured</option>
                  <option value="price-asc">Price: low to high</option>
                  <option value="price-desc">Price: high to low</option>
                  <option value="rating">Top rated</option>
                  <option value="name">Name: A to Z</option>
                </select>
              </div>
            </div>

            {activeFilterCount > 0 && (
              <div className="mb-5 flex flex-wrap items-center gap-2">
                {filters.q && (
                  <FilterChip label={`Search: ${filters.q}`} onRemove={() => updateFilters({ q: '' })} />
                )}
                {filters.category && (
                  <FilterChip
                    label={categoriesState.data?.find((item) => item.id === filters.category)?.shortName || 'Category'}
                    onRemove={() => updateFilters({ category: '' })}
                  />
                )}
                {filters.minPrice && (
                  <FilterChip label={`Min ₹${filters.minPrice}`} onRemove={() => updateFilters({ minPrice: '' })} />
                )}
                {filters.maxPrice && (
                  <FilterChip label={`Max ₹${filters.maxPrice}`} onRemove={() => updateFilters({ maxPrice: '' })} />
                )}
                {filters.availability !== 'all' && (
                  <FilterChip label={filters.availability} onRemove={() => updateFilters({ availability: 'all' })} />
                )}
              </div>
            )}

            {productsState.isLoading && <ProductGridSkeleton count={8} />}
            {productsState.isError && (
              <ErrorState message={productsState.error} onRetry={productsState.refetch} />
            )}
            {productsState.status === 'success' && productsState.data.items.length === 0 && (
              <EmptyState
                title="No products found"
                description="Try removing a filter or searching for a different item."
                actionLabel="Clear filters"
                onAction={resetFilters}
              />
            )}
            {productsState.status === 'success' && productsState.data.items.length > 0 && (
              <>
                <ProductGrid products={productsState.data.items} />
                <Pagination
                  page={productsState.data.page}
                  pages={productsState.data.pages}
                  onPageChange={(page) => updateFilters({ page })}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function FilterChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-primary/30 bg-brand-secondary/60 px-3 py-1 text-xs font-medium capitalize text-brand-dark">
      {label}
      <button type="button" onClick={onRemove} aria-label={`Remove ${label} filter`}>
        <X size={12} aria-hidden="true" />
      </button>
    </span>
  )
}
