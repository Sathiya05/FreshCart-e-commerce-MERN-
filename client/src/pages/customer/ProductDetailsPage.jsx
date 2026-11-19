import { useEffect, useState } from 'react'
import { Check, Heart, RotateCcw, ShieldCheck, ShoppingCart, Truck, Zap } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import Badge from '../../components/Badge.jsx'
import Breadcrumbs from '../../components/Breadcrumbs.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import ProductGrid from '../../components/ProductGrid.jsx'
import QuantitySelector from '../../components/QuantitySelector.jsx'
import Rating from '../../components/Rating.jsx'
import { SkeletonLine } from '../../components/Skeleton.jsx'
import { useAppDispatch, useAppSelector } from '../../redux/hooks.js'
import { addToCart } from '../../redux/cartSlice.js'
import { selectIsWishlisted, toggleWishlist } from '../../redux/wishlistSlice.js'
import { pushToast } from '../../redux/uiSlice.js'
import { formatCurrency, formatDiscount, getGalleryImages } from '../../utils/format.js'
import { useAsync } from '../../hooks/useAsync.js'
import {
  getProductById,
  getRelatedProducts,
  getReviewsByProduct,
} from '../../services/catalog.service.js'

export default function ProductDetailsPage() {
  const { id } = useParams()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(0)

  const isWishlisted = useAppSelector(selectIsWishlisted(id))

  const { status, data, error, refetch } = useAsync(async () => {
    const product = await getProductById(id)
    if (!product) return null
    const [reviews, related] = await Promise.all([
      getReviewsByProduct(product.id),
      getRelatedProducts(product.id),
    ])
    return { product, reviews, related }
  }, [id])

  useEffect(() => {
    setQuantity(1)
    setActiveImage(0)
  }, [id])

  if (status === 'loading') {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-2">
          <SkeletonLine className="aspect-square w-full rounded-2xl" />
          <div className="space-y-4">
            <SkeletonLine className="h-4 w-32" />
            <SkeletonLine className="h-10 w-full" />
            <SkeletonLine className="h-6 w-40" />
            <SkeletonLine className="h-24 w-full" />
            <SkeletonLine className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <ErrorState message={error} onRetry={refetch} />
      </div>
    )
  }

  if (status === 'success' && !data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <EmptyState
          title="Product not found"
          description="This item is not available in the catalog."
          actionLabel="Back to shop"
          actionTo="/shop"
        />
      </div>
    )
  }

  const { product, reviews, related } = data
  const gallery = getGalleryImages(product.image)
  const discount = formatDiscount(product.price, product.discountPrice)

  const handleAddToCart = async () => {
    const result = await dispatch(addToCart(product, quantity))
    if (result === null) return
    dispatch(
      pushToast({
        title: 'Added to cart',
        message: `${quantity} × ${product.name} added successfully.`,
      }),
    )
  }

  const handleBuyNow = async () => {
    if (product.stock <= 0) return
    const result = await dispatch(addToCart(product, quantity))
    if (result === null) return
    dispatch(
      pushToast({
        type: 'info',
        title: 'Buying now',
        message: `${quantity} × ${product.name} is ready for checkout.`,
      }),
    )
    navigate('/checkout')
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Breadcrumbs
        items={[
          { label: 'Shop', to: '/shop' },
          {
            label: product.categoryName,
            to: `/categories/${product.categorySlug || product.categoryId}`,
          },
          { label: product.name },
        ]}
      />

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div>
          <div className="overflow-hidden rounded-2xl border border-app-border bg-surface">
            <img
              src={gallery[activeImage]}
              alt={product.name}
              className="aspect-square w-full object-cover"
            />
          </div>
          <div className="mt-3 flex gap-3">
            {gallery.map((image, index) => (
              <button
                key={image}
                type="button"
                onClick={() => setActiveImage(index)}
                className={`h-20 w-20 overflow-hidden rounded-xl border-2 ${activeImage === index ? 'border-brand-primary' : 'border-transparent'}`}
                aria-label={`View product image ${index + 1}`}
              >
                <img src={image} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="brand">{product.categoryName}</Badge>
            {discount > 0 && <Badge tone="success">{discount}% off</Badge>}
            {product.badge && <Badge tone="warning">{product.badge}</Badge>}
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
            {product.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-4">
            <Rating value={product.rating} count={product.reviewCount} />
            <span className="text-sm text-text-secondary">SKU: {product.sku}</span>
            <span className="text-sm text-text-secondary">Brand: {product.brand}</span>
          </div>

          <div className="mt-6 flex flex-wrap items-baseline gap-3">
            <span className="text-4xl font-bold text-brand-dark">
              {formatCurrency(product.discountPrice || product.price)}
            </span>
            {product.discountPrice && (
              <span className="text-lg text-text-secondary line-through">
                {formatCurrency(product.price)}
              </span>
            )}
            <span className="text-sm text-text-secondary">/ {product.unit}</span>
          </div>

          <p className="mt-5 text-sm leading-7 text-text-secondary">
            {product.description}
          </p>

          <div className="mt-6 rounded-xl border border-app-border bg-surface p-4">
            <p className={`text-sm font-semibold ${product.stock <= 15 ? 'text-amber-700' : 'text-brand-primary'}`}>
              {product.stock > 15
                ? `In stock — ${product.stock} units available`
                : `Only ${product.stock} units left`}
            </p>
            <p className="mt-1 text-xs text-text-secondary">
              Stock is verified again before real order confirmation in Phase 4.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <QuantitySelector
              value={quantity}
              onChange={setQuantity}
              max={product.stock || 1}
            />
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-app-border bg-surface px-5 text-sm font-semibold text-text-primary hover:border-brand-primary hover:text-brand-dark disabled:opacity-50 sm:flex-none"
            >
              <ShoppingCart size={17} aria-hidden="true" />
              Add to cart
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={product.stock <= 0}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-primary px-5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50 sm:flex-none"
            >
              <Zap size={17} aria-hidden="true" />
              Buy now
            </button>
            <button
              type="button"
              onClick={handleWishlist}
              className={`inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold ${
                isWishlisted
                  ? 'border-red-200 bg-red-50 text-red-600'
                  : 'border-app-border text-text-secondary hover:border-brand-primary hover:text-brand-primary'
              }`}
              aria-pressed={isWishlisted}
            >
              <Heart size={17} className={isWishlisted ? 'fill-current' : ''} aria-hidden="true" />
              {isWishlisted ? 'Saved' : 'Wishlist'}
            </button>
          </div>

          <div className="mt-8 grid gap-3 border-t border-app-border pt-6 sm:grid-cols-3">
            {[
              { icon: Truck, label: 'Fresh delivery' },
              { icon: ShieldCheck, label: 'Quality checked' },
              { icon: RotateCcw, label: 'Easy support' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm text-text-secondary">
                <Icon size={16} className="text-brand-primary" aria-hidden="true" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="mt-16 grid gap-10 lg:grid-cols-[1.4fr_0.6fr]">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Product details</h2>
          <p className="mt-3 text-sm leading-7 text-text-secondary">
            {product.description} Store in a cool, dry place or refrigerate where
            appropriate. Packaging and labels may vary slightly between batches.
          </p>

          <div className="mt-8">
            <h2 className="text-xl font-semibold text-text-primary">Customer reviews</h2>
            {reviews.length === 0 ? (
              <p className="mt-3 text-sm text-text-secondary">
                No reviews yet. Reviews will appear here after real orders are enabled.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                {reviews.map((review) => (
                  <article key={review.id} className="rounded-xl border border-app-border bg-surface p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-text-primary">{review.userName}</p>
                      <Rating value={review.rating} showValue={false} />
                    </div>
                    <p className="mt-2 text-sm leading-6 text-text-secondary">{review.comment}</p>
                    <p className="mt-2 text-xs text-text-secondary">{review.date}</p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-app-border bg-surface p-5">
          <h3 className="font-semibold text-text-primary">At a glance</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-text-secondary">Unit</dt>
              <dd className="font-medium">{product.unit}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-text-secondary">Brand</dt>
              <dd className="font-medium">{product.brand}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-text-secondary">Category</dt>
              <dd className="font-medium">{product.categoryName}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-text-secondary">Rating</dt>
              <dd className="inline-flex items-center gap-1 font-medium">
                <Check size={14} className="text-brand-primary" aria-hidden="true" />
                {product.rating.toFixed(1)}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-semibold text-text-primary">Related products</h2>
          <div className="mt-5">
            <ProductGrid products={related} />
          </div>
        </section>
      )}
    </div>
  )
}
