import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ page = 1, pages = 1, onPageChange }) {
  if (pages <= 1) return null

  const numbers = Array.from({ length: pages }, (_, index) => index + 1)

  return (
    <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="grid h-10 w-10 place-items-center rounded-xl border border-app-border bg-surface text-text-secondary hover:border-brand-primary disabled:opacity-40"
        aria-label="Previous page"
      >
        <ChevronLeft size={17} aria-hidden="true" />
      </button>
      {numbers.map((number) => (
        <button
          key={number}
          type="button"
          onClick={() => onPageChange(number)}
          aria-current={number === page ? 'page' : undefined}
          className={`h-10 min-w-10 rounded-xl border px-3 text-sm font-semibold ${
            number === page
              ? 'border-brand-primary bg-brand-primary text-white'
              : 'border-app-border bg-surface text-text-secondary hover:border-brand-primary'
          }`}
        >
          {number}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onPageChange(Math.min(pages, page + 1))}
        disabled={page === pages}
        className="grid h-10 w-10 place-items-center rounded-xl border border-app-border bg-surface text-text-secondary hover:border-brand-primary disabled:opacity-40"
        aria-label="Next page"
      >
        <ChevronRight size={17} aria-hidden="true" />
      </button>
    </nav>
  )
}
