import { Heart, ShoppingCart, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../../components/Button.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import ProductGrid from '../../components/ProductGrid.jsx'
import { ProductGridSkeleton } from '../../components/Skeleton.jsx'
import { useAppDispatch, useAppSelector } from '../../redux/hooks.js'
import { addToCart } from '../../redux/cartSlice.js'
import { clearWishlist, removeFromWishlist, selectWishlistIds } from '../../redux/wishlistSlice.js'
import { pushToast } from '../../redux/uiSlice.js'
import { useAsync } from '../../hooks/useAsync.js'
import { getProducts } from '../../services/catalog.service.js'
import { useState } from 'react'

export default function WishlistPage() {
  const dispatch = useAppDispatch()
  const ids = useAppSelector(selectWishlistIds)
  const [clearOpen, setClearOpen] = useState(false)
  const idsKey = ids.join(',')

  const { status, data, error, refetch } = useAsync(
    () => (idsKey ? getProducts({ ids: idsKey.split(',') }) : Promise.resolve({ items: [] })),
    [idsKey],
  )

  const products = data?.items || []

  const addAllToCart = () => {
    products.forEach((product) => dispatch(addToCart(product, 1)))
    dispatch(
      pushToast({
        title: 'Moved to cart',
        message: `${products.length} wishlist item${products.length === 1 ? '' : 's'} added to your cart.`,
      }),
    )
  }

  if (ids.length === 0) {
    return (
      <>
        <PageHeader title="Your wishlist" breadcrumbs={[{ label: 'Wishlist' }]} />
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <EmptyState
            icon={Heart}
            title="Nothing saved yet"
            description="Tap the heart on any product to keep it here for later."
            actionLabel="Explore products"
            actionTo="/shop"
          />
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Your wishlist"
        description="Products you have saved for later."
        breadcrumbs={[{ label: 'Wishlist' }]}
        actions={
          <>
            <Button variant="outline" onClick={addAllToCart} disabled={products.length === 0}>
              <ShoppingCart size={16} aria-hidden="true" />
              Add all to cart
            </Button>
            <Button variant="ghost" className="text-red-600" onClick={() => setClearOpen(true)}>
              <Trash2 size={16} aria-hidden="true" />
              Clear
            </Button>
          </>
        }
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {status === 'loading' && <ProductGridSkeleton count={4} />}
        {status === 'error' && <ErrorState message={error} onRetry={refetch} />}
        {status === 'success' && products.length === 0 && (
          <EmptyState
            title="Saved products unavailable"
            description="These items are no longer available in the catalog."
            actionLabel="Browse products"
            actionTo="/shop"
          />
        )}
        {status === 'success' && products.length > 0 && (
          <div className="relative">
            <ProductGrid products={products} />
            <div className="mt-6 flex flex-wrap gap-3">
              {products.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => {
                    dispatch(removeFromWishlist(product.id))
                    dispatch(pushToast({ type: 'info', message: `${product.name} removed from wishlist.` }))
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-app-border px-3 py-1.5 text-xs text-text-secondary hover:border-red-200 hover:text-red-600"
                >
                  <Trash2 size={13} aria-hidden="true" />
                  Remove {product.name}
                </button>
              ))}
            </div>
            <p className="mt-6 text-sm text-text-secondary">
              Looking for more? <Link to="/shop" className="font-semibold text-brand-primary">Continue shopping</Link>
            </p>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={clearOpen}
        onClose={() => setClearOpen(false)}
        onConfirm={() => {
          dispatch(clearWishlist())
          dispatch(pushToast({ type: 'info', message: 'Wishlist cleared.' }))
        }}
        title="Clear your wishlist?"
        message="All saved products will be removed."
        confirmLabel="Clear wishlist"
      />
    </>
  )
}
