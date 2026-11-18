import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Minus, Plus, ShoppingCart, Trash2, Tag } from 'lucide-react'
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
  selectCartSubtotal,
  updateCartQuantity,
} from '../../redux/cartSlice.js'
import { pushToast } from '../../redux/uiSlice.js'
import { validateDemoCoupon } from '../../services/account.service.js'
import { formatCurrency } from '../../utils/format.js'

export default function CartPage() {
  const dispatch = useAppDispatch()
  const items = useAppSelector(selectCartItems)
  const subtotal = useAppSelector(selectCartSubtotal)

  const [couponCode, setCouponCode] = useState('')
  const [coupon, setCoupon] = useState(null)
  const [couponError, setCouponError] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [itemToRemove, setItemToRemove] = useState(null)
  const [clearOpen, setClearOpen] = useState(false)

  const deliveryCharge = subtotal >= 499 ? 0 : 30

  const handleCoupon = async (event) => {
    event.preventDefault()
    setCouponLoading(true)
    setCouponError('')
    try {
      const result = await validateDemoCoupon(couponCode, subtotal)
      setCoupon(result)
      dispatch(
        pushToast({
          title: 'Coupon applied',
          message: `${result.code} saved you ${formatCurrency(result.discount)} in this demo.`,
        }),
      )
    } catch (error) {
      setCoupon(null)
      setCouponError(error.message)
    } finally {
      setCouponLoading(false)
    }
  }

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
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-text-secondary">{items.length} item{items.length === 1 ? '' : 's'} in your cart</p>
              <button
                type="button"
                onClick={() => setClearOpen(true)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700"
              >
                <Trash2 size={15} aria-hidden="true" />
                Clear cart
              </button>
            </div>

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

            <div className="mt-6 rounded-2xl border border-app-border bg-surface p-5">
              <label htmlFor="cart-coupon" className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                <Tag size={16} className="text-brand-primary" aria-hidden="true" />
                Have a coupon?
              </label>
              <form onSubmit={handleCoupon} className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input
                  id="cart-coupon"
                  value={couponCode}
                  onChange={(event) => setCouponCode(event.target.value)}
                  placeholder="Enter code (try FRESH10)"
                  className="h-11 flex-1 rounded-xl border border-app-border px-3 text-sm uppercase outline-none focus:border-brand-primary"
                />
                <Button type="submit" variant="outline" disabled={couponLoading || !couponCode.trim()}>
                  {couponLoading ? 'Checking…' : 'Apply'}
                </Button>
              </form>
              {couponError && <p className="mt-2 text-sm text-red-600">{couponError}</p>}
              {coupon && (
                <p className="mt-2 text-sm font-medium text-brand-primary">
                  {coupon.code} applied — {formatCurrency(coupon.discount)} off
                </p>
              )}
              <p className="mt-2 text-xs text-text-secondary">
                Coupon validation is demo-only. Backend calculates real discounts.
              </p>
            </div>
          </div>

          <OrderSummary
            subtotal={subtotal}
            discount={coupon?.discount || 0}
            deliveryCharge={deliveryCharge}
            action={
              <Button as={Link} to="/checkout" className="w-full" size="lg">
                Proceed to checkout
              </Button>
            }
            note="Payment integration is planned for Phase 5."
          />
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(itemToRemove)}
        onClose={() => setItemToRemove(null)}
        onConfirm={() => {
          dispatch(removeFromCart(itemToRemove.id))
          dispatch(pushToast({ type: 'info', message: `${itemToRemove.name} removed from cart.` }))
        }}
        title="Remove this item?"
        message={`${itemToRemove?.name || 'This item'} will be removed from your cart.`}
        confirmLabel="Remove item"
      />

      <ConfirmDialog
        open={clearOpen}
        onClose={() => setClearOpen(false)}
        onConfirm={() => {
          dispatch(clearCart())
          dispatch(pushToast({ type: 'info', message: 'Your cart has been cleared.' }))
        }}
        title="Clear the entire cart?"
        message="All items will be removed. This cannot be undone."
        confirmLabel="Clear cart"
      />
    </>
  )
}
