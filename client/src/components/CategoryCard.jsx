import { Apple, Carrot, Cookie, Croissant, CupSoda, Fish, Milk, Wheat } from 'lucide-react'
import { Link } from 'react-router-dom'

const iconMap = {
  Carrot,
  Apple,
  Milk,
  Croissant,
  CupSoda,
  Cookie,
  Wheat,
  Fish,
}

export default function CategoryCard({ category }) {
  const Icon = iconMap[category.icon] || Carrot

  return (
    <Link
      to={`/categories/${category.slug}`}
      className="group overflow-hidden rounded-2xl border border-app-border bg-surface shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-primary/40 hover:shadow-md"
    >
      <div className="relative h-32 overflow-hidden bg-app-background">
        <img
          src={category.image}
          alt={category.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <span className="absolute bottom-3 left-3 grid h-9 w-9 place-items-center rounded-xl bg-white/95 text-brand-primary shadow-sm">
          <Icon size={18} aria-hidden="true" />
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-text-primary group-hover:text-brand-primary">
          {category.shortName}
        </h3>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-text-secondary">
          {category.description}
        </p>
        {category.productCount !== undefined && (
          <p className="mt-3 text-xs font-semibold text-brand-primary">
            {category.productCount} products
          </p>
        )}
      </div>
    </Link>
  )
}
