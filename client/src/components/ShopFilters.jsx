import { RotateCcw, SlidersHorizontal, X } from 'lucide-react'
import Button from './Button.jsx'

const sortOptions = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Top rated' },
  { value: 'name', label: 'Name: A to Z' },
]

export default function ShopFilters({ filters, categories, onChange, onReset, onApply, resultCount }) {
  const update = (patch) => onChange(patch)

  return (
    <aside className="rounded-2xl border border-app-border bg-surface p-5 shadow-sm lg:sticky lg:top-24">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold text-text-primary">
          <SlidersHorizontal size={17} aria-hidden="true" />
          Filters
        </h2>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex min-h-11 items-center gap-1 text-xs font-semibold text-text-secondary hover:text-brand-primary"
          >
            <RotateCcw size={13} aria-hidden="true" />
            Reset
          </button>
          {onApply && (
            <button
              type="button"
              onClick={onApply}
              className="grid h-11 w-11 place-items-center rounded-lg text-text-secondary hover:bg-app-background lg:hidden"
              aria-label="Close filters"
            >
              <X size={18} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <p className="mt-2 text-xs text-text-secondary">{resultCount} products match</p>

      <div className="mt-6 space-y-6">
        <div>
          <label htmlFor="filter-search" className="mb-2 block text-sm font-medium text-text-primary">
            Search products
          </label>
          <input
            id="filter-search"
            type="search"
            value={filters.q}
            onChange={(event) => update({ q: event.target.value })}
            placeholder=" tomatoes, milk…"
            className="h-10 w-full rounded-xl border border-app-border bg-surface px-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
          />
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-text-primary">Category</legend>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="radio"
                name="category"
                checked={!filters.category}
                onChange={() => update({ category: '' })}
                className="accent-brand-primary"
              />
              All categories
            </label>
            {categories.map((category) => (
              <label key={category.id} className="flex items-center gap-2 text-sm text-text-secondary">
                <input
                  type="radio"
                  name="category"
                  checked={filters.category === category.id}
                  onChange={() => update({ category: category.id })}
                  className="accent-brand-primary"
                />
                {category.shortName}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-text-primary">Price range</legend>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min="0"
              aria-label="Minimum price"
              value={filters.minPrice}
              onChange={(event) => update({ minPrice: event.target.value })}
              placeholder="Min"
              className="h-10 rounded-xl border border-app-border bg-surface px-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
            />
            <input
              type="number"
              min="0"
              aria-label="Maximum price"
              value={filters.maxPrice}
              onChange={(event) => update({ maxPrice: event.target.value })}
              placeholder="Max"
              className="h-10 rounded-xl border border-app-border bg-surface px-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
            />
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-text-primary">Availability</legend>
          <div className="space-y-2">
            {[
              { value: 'all', label: 'All products' },
              { value: 'in-stock', label: 'In stock only' },
              { value: 'low-stock', label: 'Low stock' },
            ].map((option) => (
              <label key={option.value} className="flex items-center gap-2 text-sm text-text-secondary">
                <input
                  type="radio"
                  name="availability"
                  checked={filters.availability === option.value}
                  onChange={() => update({ availability: option.value })}
                  className="accent-brand-primary"
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="sort-products" className="mb-2 block text-sm font-medium text-text-primary">
            Sort by
          </label>
          <select
            id="sort-products"
            value={filters.sort}
            onChange={(event) => update({ sort: event.target.value })}
            className="h-10 w-full rounded-xl border border-app-border bg-surface px-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <Button variant="outline" className="w-full" onClick={onReset}>
          Clear all filters
        </Button>
        {onApply && (
          <Button className="w-full lg:hidden" onClick={onApply}>
            Show {resultCount} products
          </Button>
        )}
      </div>
    </aside>
  )
}
