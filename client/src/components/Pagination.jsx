import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ page = 1, pages = 1, onPageChange }) {
  if (pages <= 1) return null

  // Keep the control narrow on phones even for large catalogs.
  const visiblePages = []
  for (let number = 1; number <= pages; number += 1) {
    if (number === 1 || number === pages || Math.abs(number - page) <= 1) {
      visiblePages.push(number)
    } else if (visiblePages[visiblePages.length - 1] !== 'ellipsis') {
      visiblePages.push('ellipsis')
    }
  }

  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2" aria-label="Pagination">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="grid h-11 w-11 place-items-center rounded-xl border border-app-border bg-surface text-text-secondary hover:border-brand-primary disabled:opacity-40 sm:h-10 sm:w-10"
        aria-label="Previous page"
      >
        <ChevronLeft size={17} aria-hidden="true" />
      </button>
      {visiblePages.map((item, index) =>
        item === 'ellipsis' ? (
          <span
            key={`ellipsis-${index}`}
            className="grid h-10 w-8 place-items-center text-sm text-text-secondary"
            aria-hidden="true"
          >
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            aria-current={item === page ? 'page' : undefined}
            className={`h-11 min-w-11 rounded-xl border px-3 text-sm font-semibold sm:h-10 sm:min-w-10 ${
              item === page
                ? 'border-brand-primary bg-brand-primary text-white'
                : 'border-app-border bg-surface text-text-secondary hover:border-brand-primary'
            }`}
          >
            {item}
          </button>
        ),
      )}
      <button
        type="button"
        onClick={() => onPageChange(Math.min(pages, page + 1))}
        disabled={page === pages}
        className="grid h-11 w-11 place-items-center rounded-xl border border-app-border bg-surface text-text-secondary hover:border-brand-primary disabled:opacity-40 sm:h-10 sm:w-10"
        aria-label="Next page"
      >
        <ChevronRight size={17} aria-hidden="true" />
      </button>
    </nav>
  )
}
