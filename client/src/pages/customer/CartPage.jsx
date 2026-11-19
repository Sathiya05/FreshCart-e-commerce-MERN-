import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Trash2 } from 'lucide-react'
import Button from '../../components/Button.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import OrderSummary from '../../components/OrderSummary.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import QuantitySelector from '../../components/QuantitySelector.jsx'
import { useAppDispatch, useAppSelector } from '../../redux/hooks.js'
import {
  clearCart,
  removeFromCart,
  selectCartItems,
  selectCartStatus,
  selectCartSubtotal,
  updateCartQuantity,
} from '../../redux/cartSlice.js'
import { pushToast } from '../../redux/uiSlice.js'
import { formatCurrency } from '../../utils/format.js'

export default function CartPage() {
  const dispatch = useAppDispatch()
  const items = useAppSelector(selectCartItems)
  const subtotal = useAppSelector(selectCartSubtotal)
  const cartStatus = useAppSelector(selectCartStatus)

  const [itemToRemove, setItemToRemove] = useState(null)
  const [clearOpen, setClearOpen] = useState(false)

  const deliveryCharge = subtotal >= 499 ? 0 : 30

  if (items.length === 0) {
    return (
      <>
        <PageHeader title="Your cart" breadcrumbs={[{ label: 'Cart' }]} />
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <EmptyState
            icon={ShoppingCart}
            title="Your cart is empty"
            description="Add fresh groceries from the shop to see them here."
            actionLabel="Start shopping"
            actionTo="/shop"
          />
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Your cart"
        description="Review your items and adjust quantities before checkout."
        breadcrumbs={[{ label: 'Cart' }]}
      />
      <div className="mx-auto max-w-7xl px-4 pb-32 pt-8 sm:px-6 lg:pb-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-text-secondary">
                {items.length} product{items.length === 1 ? '' : 's'} in your cart
              </p>
              <button
                type="button"
                onClick={() => setClearOpen(true)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700"
              >
                <Trash2 size={15} aria-hidden="true" />
                Clear cart
              </button>
            </div>

            {cartStatus === 'loading' && (
              <p className="mb-3 text-xs text-text-secondary" role="status">
                Syncing your cart…
              </p>
            )}

            <div className="space-y-4">
              {items.map(({ product, quantity }) => (
                <article key={product.id} className="flex gap-4 rounded-2xl border border-app-border bg-surface p-4 shadow-sm">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-24 w-24 shrink-0 rounded-xl object-cover sm:h-28 sm:w-28"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <Link to={`/products/${product.id}`} className="font-semibold text-text-primary hover:text-brand-primary">
                          {product.name}
                        </Link>
                        <p className="mt-1 text-xs text-text-secondary">
                          {product.unit} · {product.brand}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setItemToRemove(product)}
                        className="rounded-lg p-1.5 text-text-secondary hover:bg-red-50 hover:text-red-600"
                        aria-label={`Remove ${product.name}`}
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <QuantitySelector
                        size="sm"
                        value={quantity}
                        max={product.stock}
                        onChange={(value) =>
                          dispatch(updateCartQuantity({ productId: product.id, quantity: value }))
                        }
                      />
                      <p className="font-bold text-text-primary">
                        {formatCurrency((product.discountPrice || product.price) * quantity)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <OrderSummary
            subtotal={subtotal}
            deliveryCharge={deliveryCharge}
            action={
              <Button as={Link} to="/checkout" className="w-full" size="lg">
                Proceed to checkout
              </Button>
            }
            note="Cash on delivery and verified Razorpay payments are available at checkout."
          />
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-app-border bg-surface/95 px-4 pb-safe pt-3 shadow-[0_-8px_24px_rgba(16,92,54,0.08)] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="min-w-0">
            <p className="text-xs text-text-secondary">{items.length} items · total</p>
            <p className="text-lg font-bold text-text-primary">
              {formatCurrency(subtotal + deliveryCharge)}
            </p>
          </div>
          <Button as={Link} to="/checkout" className="ml-auto flex-1 sm:max-w-xs" size="lg">
            Checkout
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(itemToRemove)}
        onClose={() => setItemToRemove(null)}
        onConfirm={async () => {
          const result = await dispatch(removeFromCart(itemToRemove.id))
          if (result !== null) {
            dispatch(pushToast({ type: 'info', message: `${itemToRemove.name} removed from cart.` }))
          }
        }}
        title="Remove this item?"
        message={`${itemToRemove?.name || 'This item'} will be removed from your cart.`}
        confirmLabel="Remove item"
      />

      <ConfirmDialog
        open={clearOpen}
        onClose={() => setClearOpen(false)}
        onConfirm={async () => {
          const result = await dispatch(clearCart())
          if (result !== null) {
            dispatch(pushToast({ type: 'info', message: 'Your cart has been cleared.' }))
          }
        }}
        title="Clear the entire cart?"
        message="All items will be removed. This cannot be undone."
        confirmLabel="Clear cart"
      />
    </>
  )
}
