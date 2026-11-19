import { useEffect, useMemo, useState } from 'react'
import { CreditCard, LockKeyhole, MapPin, ShieldCheck, Wallet } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import AddressCard from '../../components/AddressCard.jsx'
import Badge from '../../components/Badge.jsx'
import Button from '../../components/Button.jsx'
import DeliverySlotPicker from '../../components/DeliverySlotPicker.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import OrderSummary from '../../components/OrderSummary.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import { SkeletonLine } from '../../components/Skeleton.jsx'
import { useAppDispatch, useAppSelector } from '../../redux/hooks.js'
import { clearCartLocal, selectCartItems, selectCartSubtotal } from '../../redux/cartSlice.js'
import { pushToast } from '../../redux/uiSlice.js'
import { formatCurrency } from '../../utils/format.js'
import { useAsync } from '../../hooks/useAsync.js'
import useRazorpayCheckout from '../../hooks/useRazorpayCheckout.js'
import {
  createOrder,
  createPaymentOrder,
  getAddresses,
  getDeliverySlots,
  getPaymentConfig,
} from '../../services/commerce.service.js'

export default function CheckoutPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const pay = useRazorpayCheckout()
  const items = useAppSelector(selectCartItems)
  const subtotal = useAppSelector(selectCartSubtotal)
  const addressesState = useAsync(getAddresses, [])
  const slotsState = useAsync(getDeliverySlots, [])
  const paymentConfigState = useAsync(getPaymentConfig, [])
  const paymentEnabled = Boolean(paymentConfigState.data?.enabled)

  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [selectedSlotId, setSelectedSlotId] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [submitting, setSubmitting] = useState(false)
  const [orderError, setOrderError] = useState('')

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

  useEffect(() => {
    if (!paymentEnabled && paymentMethod === 'razorpay') {
      setPaymentMethod('cod')
    }
  }, [paymentEnabled, paymentMethod])

  const selectedSlot = useMemo(
    () => slots.find((slot) => slot.id === selectedSlotId),
    [slots, selectedSlotId],
  )
  const deliveryCharge = subtotal >= 499 ? 0 : 30

  const handlePlaceOrder = async () => {
    if (!selectedAddressId || submitting) return
    if (paymentMethod === 'razorpay' && !paymentEnabled) return

    setSubmitting(true)
    setOrderError('')

    const payload = {
      addressId: selectedAddressId,
      paymentMethod,
      deliverySlot: selectedSlot?.label || '',
    }

    try {
      if (paymentMethod === 'razorpay') {
        const payment = await createPaymentOrder(payload)
        dispatch(clearCartLocal())
        dispatch(
          pushToast({
            title: 'Order created',
            message: `${payment.orderNumber} is waiting for payment.`,
          }),
        )
        await pay(payment)
        return
      }

      const order = await createOrder(payload)
      dispatch(clearCartLocal())
      dispatch(
        pushToast({
          title: 'Order placed',
          message: `${order.orderNumber} is confirmed.`,
        }),
      )
      navigate(`/account/orders/${order.id}`)
    } catch (error) {
      const message = error?.message || 'Could not place your order.'
      setOrderError(message)
      dispatch(pushToast({ type: 'error', title: 'Order failed', message }))
    } finally {
      setSubmitting(false)
    }
  }

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
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <LockKeyhole size={17} aria-hidden="true" />
          Orders are created securely on the server with live prices and stock. Online payments are verified by FreshCart before an order is marked paid.
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
              {addressesState.status === 'success' && addresses.length === 0 && (
                <EmptyState
                  title="No saved addresses"
                  description="Add a delivery address before placing your order."
                  actionLabel="Add address"
                  actionTo="/account/addresses"
                />
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
              <p className="mt-2 text-xs text-text-secondary">
                Delivery slots are a preview. The selected slot is saved with your order.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-lg font-semibold text-text-primary">
                3. Payment method
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {paymentConfigState.status === 'loading' ? (
                  <SkeletonLine className="h-24 w-full rounded-xl" />
                ) : paymentEnabled ? (
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('razorpay')}
                    className={`rounded-xl border p-4 text-left ${
                      paymentMethod === 'razorpay'
                        ? 'border-brand-primary bg-brand-secondary/40'
                        : 'border-app-border bg-surface'
                    }`}
                  >
                    <span className="flex items-center gap-2 font-semibold text-text-primary">
                      <CreditCard size={17} className="text-brand-primary" aria-hidden="true" />
                      Razorpay
                    </span>
                    <span className="mt-2 block text-xs text-text-secondary">
                      Cards, UPI apps (Google Pay / PhonePe) and net banking. Verified by FreshCart.
                    </span>
                  </button>
                ) : (
                  <div className="rounded-xl border border-app-border bg-surface p-4 opacity-60">
                    <span className="flex items-center gap-2 font-semibold text-text-primary">
                      <CreditCard size={17} className="text-brand-primary" aria-hidden="true" />
                      Razorpay
                    </span>
                    <span className="mt-2 block text-xs text-text-secondary">
                      Cards, UPI and net banking. Not configured on this server.
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`rounded-xl border p-4 text-left ${
                    paymentMethod === 'cod'
                      ? 'border-brand-primary bg-brand-secondary/40'
                      : 'border-app-border bg-surface'
                  }`}
                >
                  <span className="flex items-center gap-2 font-semibold text-text-primary">
                    <Wallet size={17} className="text-brand-primary" aria-hidden="true" />
                    Cash on delivery
                  </span>
                  <span className="mt-2 block text-xs text-text-secondary">
                    Pay when your order arrives. Available now.
                  </span>
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone="success">COD available</Badge>
                {paymentEnabled ? (
                  <Badge tone="success">Razorpay available</Badge>
                ) : (
                  <Badge tone="warning">Online payments unavailable</Badge>
                )}
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

          <div>
            <OrderSummary
              subtotal={subtotal}
              deliveryCharge={deliveryCharge}
              action={
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handlePlaceOrder}
                  disabled={
                    !selectedAddressId ||
                    submitting ||
                    (paymentMethod === 'razorpay' && !paymentEnabled)
                  }
                >
                  <ShieldCheck size={16} aria-hidden="true" />
                  {submitting
                    ? 'Creating order…'
                    : paymentMethod === 'razorpay'
                      ? 'Pay with Razorpay'
                      : 'Place order'}
                </Button>
              }
              note={
                paymentMethod === 'razorpay'
                  ? 'Your order is created first, then Razorpay opens for secure payment.'
                  : 'Your order is created immediately. Pay when it arrives.'
              }
            />
            {orderError && (
              <p className="mt-3 text-center text-sm text-red-600" role="alert">
                {orderError}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
