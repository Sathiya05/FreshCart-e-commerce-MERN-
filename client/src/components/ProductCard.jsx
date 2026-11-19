import { Heart, ShoppingCart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../redux/hooks.js'
import { addToCart } from '../redux/cartSlice.js'
import { selectIsWishlisted, toggleWishlist } from '../redux/wishlistSlice.js'
import { pushToast } from '../redux/uiSlice.js'
import { formatCurrency, formatDiscount } from '../utils/format.js'
import Badge from './Badge.jsx'
import Button from './Button.jsx'
import Rating from './Rating.jsx'

export default function ProductCard({ product }) {
  const dispatch = useAppDispatch()
  const isWishlisted = useAppSelector(selectIsWishlisted(product.id))
  const discount = formatDiscount(product.price, product.discountPrice)

  const handleAddToCart = async () => {
    if (product.stock <= 0) return
    const result = await dispatch(addToCart(product, 1))
    if (result === null) return
    dispatch(
      pushToast({
        title: 'Added to cart',
        message: `${product.name} is ready in your cart.`,
      }),
    )
  }

  const handleWishlist = () => {
    dispatch(toggleWishlist(product.id))
    dispatch(
      pushToast({
        type: 'info',
        message: isWishlisted
          ? `${product.name} removed from wishlist.`
          : `${product.name} saved to wishlist.`,
      }),
    )
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-app-border bg-surface shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-[4/3] overflow-hidden bg-app-background">
        <Link to={`/products/${product.id}`} aria-label={`View ${product.name}`}>
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </Link>
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {discount > 0 && <Badge tone="success">{discount}% off</Badge>}
          {product.badge && <Badge tone="brand">{product.badge}</Badge>}
        </div>
        <button
          type="button"
          onClick={handleWishlist}
          className={`absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border bg-white/95 shadow-sm transition-colors ${
            isWishlisted
              ? 'border-red-200 text-red-500'
              : 'border-app-border text-text-secondary hover:text-red-500'
          }`}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={isWishlisted}
        >
          <Heart size={17} className={isWishlisted ? 'fill-current' : ''} aria-hidden="true" />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-text-secondary">
            {product.categoryName}
          </span>
          <Rating value={product.rating} count={product.reviewCount} showValue={false} />
        </div>

        <Link
          to={`/products/${product.id}`}
          className="mt-2 line-clamp-2 font-semibold text-text-primary hover:text-brand-primary"
        >
          {product.name}
        </Link>

        <p className="mt-1 text-xs text-text-secondary">{product.unit} · {product.brand}</p>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-lg font-bold text-text-primary">
            {formatCurrency(product.discountPrice || product.price)}
          </span>
          {product.discountPrice && (
            <span className="text-sm text-text-secondary line-through">
              {formatCurrency(product.price)}
            </span>
          )}
        </div>

        <p className={`mt-1 text-xs font-medium ${product.stock <= 15 ? 'text-amber-700' : 'text-brand-primary'}`}>
          {product.stock > 15 ? `In stock · ${product.stock} available` : `Only ${product.stock} left`}
        </p>

        <Button className="mt-4 w-full" onClick={handleAddToCart} disabled={product.stock <= 0}>
          <ShoppingCart size={16} aria-hidden="true" />
          {product.stock > 0 ? 'Add to cart' : 'Out of stock'}
        </Button>
      </div>
    </article>
  )
}
