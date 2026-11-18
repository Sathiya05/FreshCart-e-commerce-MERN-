import { useEffect, useMemo, useState } from 'react'
import { CreditCard, LockKeyhole, MapPin, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import AddressCard from '../../components/AddressCard.jsx'
import Badge from '../../components/Badge.jsx'
import Button from '../../components/Button.jsx'
import DeliverySlotPicker from '../../components/DeliverySlotPicker.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import OrderSummary from '../../components/OrderSummary.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import { SkeletonLine } from '../../components/Skeleton.jsx'
import { useAppSelector } from '../../redux/hooks.js'
import { selectCartItems, selectCartSubtotal } from '../../redux/cartSlice.js'
import { formatCurrency } from '../../utils/format.js'
import { useAsync } from '../../hooks/useAsync.js'
import {
  getDemoAddresses,
  getDemoDeliverySlots,
} from '../../services/account.service.js'

export default function CheckoutPage() {
  const items = useAppSelector(selectCartItems)
  const subtotal = useAppSelector(selectCartSubtotal)
  const addressesState = useAsync(getDemoAddresses, [])
  const slotsState = useAsync(getDemoDeliverySlots, [])

  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [selectedSlotId, setSelectedSlotId] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('razorpay')

  const addresses = addressesState.data || []
  const slots = slotsState.data || []

  useEffect(() => {
    if (addresses.length && !selectedAddressId) {
      setSelectedAddressId(addresses.find((item) => item.isDefault)?.id || addresses[0].id)
    }
  }, [addresses, selectedAddressId])

  useEffect(() => {
    if (slots.length && !selectedSlotId) {
      setSelectedSlotId(slots.find((item) => item.available)?.id || null)
    }
  }, [slots, selectedSlotId])

  const selectedSlot = useMemo(
    () => slots.find((slot) => slot.id === selectedSlotId),
    [slots, selectedSlotId],
  )
  const deliveryCharge = selectedSlot?.fee || 0

  if (items.length === 0) {
    return (
      <>
        <PageHeader title="Checkout" breadcrumbs={[{ label: 'Checkout' }]} />
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <EmptyState
            title="Your cart is empty"
            description="Add a few items before starting checkout."
            actionLabel="Go to shop"
            actionTo="/shop"
          />
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Checkout"
        description="Confirm your delivery details and review your order."
        breadcrumbs={[{ label: 'Cart', to: '/cart' }, { label: 'Checkout' }]}
      />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <LockKeyhole size={17} aria-hidden="true" />
          Checkout is a Phase 2 interface preview. Payment and order creation are
          implemented in Phases 4 and 5 — no payment is collected here.
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-8">
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-text-primary">
                  <MapPin size={18} className="text-brand-primary" aria-hidden="true" />
                  1. Delivery address
                </h2>
                <Button as={Link} to="/account/addresses" size="sm" variant="outline">
                  Manage
                </Button>
              </div>
              {addressesState.isLoading && (
                <div className="space-y-3">
                  <SkeletonLine className="h-36 w-full rounded-2xl" />
                  <SkeletonLine className="h-36 w-full rounded-2xl" />
                </div>
              )}
              {addressesState.isError && (
                <ErrorState message={addressesState.error} onRetry={addressesState.refetch} />
              )}
              <div className="grid gap-3 md:grid-cols-2">
                {addresses.map((address) => (
                  <AddressCard
                    key={address.id}
                    address={address}
                    selected={selectedAddressId === address.id}
                    onSelect={(item) => setSelectedAddressId(item.id)}
                  />
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-lg font-semibold text-text-primary">
                2. Delivery slot
              </h2>
              {slotsState.isLoading && <SkeletonLine className="h-24 w-full rounded-2xl" />}
              {slotsState.isError && <ErrorState message={slotsState.error} onRetry={slotsState.refetch} />}
              <DeliverySlotPicker
                slots={slots}
                selectedId={selectedSlotId}
                onSelect={(slot) => setSelectedSlotId(slot.id)}
              />
            </section>

            <section>
              <h2 className="mb-4 text-lg font-semibold text-text-primary">
                3. Payment method
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('razorpay')}
                  className={`rounded-xl border p-4 text-left ${paymentMethod === 'razorpay' ? 'border-brand-primary bg-brand-secondary/40' : 'border-app-border bg-surface'}`}
                >
                  <span className="flex items-center gap-2 font-semibold text-text-primary">
                    <CreditCard size={17} className="text-brand-primary" aria-hidden="true" />
                    Razorpay
                  </span>
                  <span className="mt-2 block text-xs text-text-secondary">
                    Cards, UPI and net banking. Enabled in Phase 5.
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`rounded-xl border p-4 text-left ${paymentMethod === 'cod' ? 'border-brand-primary bg-brand-secondary/40' : 'border-app-border bg-surface'}`}
                >
                  <span className="flex items-center gap-2 font-semibold text-text-primary">
                    <Wallet size={17} className="text-brand-primary" aria-hidden="true" />
                    Cash on delivery
                  </span>
                  <span className="mt-2 block text-xs text-text-secondary">
                    Available after order APIs are implemented.
                  </span>
                </button>
              </div>
              <div className="mt-3">
                <Badge tone="warning">Payment disabled in Phase 2</Badge>
              </div>
            </section>

            <section className="rounded-2xl border border-app-border bg-surface p-5">
              <h2 className="font-semibold text-text-primary">Items in this order</h2>
              <div className="mt-4 space-y-3">
                {items.map(({ product, quantity }) => (
                  <div key={product.id} className="flex items-center gap-3">
                    <img src={product.image} alt="" className="h-12 w-12 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text-primary">{product.name}</p>
                      <p className="text-xs text-text-secondary">{quantity} × {product.unit}</p>
                    </div>
                    <p className="text-sm font-semibold">
                      {formatCurrency((product.discountPrice || product.price) * quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <OrderSummary
            subtotal={subtotal}
            deliveryCharge={deliveryCharge}
            action={
              <Button className="w-full" size="lg" disabled>
                Continue to payment
              </Button>
            }
            note="This button becomes active in Phase 5 after secure Razorpay integration."
          />
        </div>
      </div>
    </>
  )
}
