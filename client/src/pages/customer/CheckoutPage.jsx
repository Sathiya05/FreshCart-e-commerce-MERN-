import { useEffect, useMemo, useState } from 'react'
import { Clock3, CreditCard, Info, LockKeyhole, MapPin, ShieldCheck, Wallet } from 'lucide-react'
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
import WhatsAppIcon from '../../components/WhatsAppIcon.jsx'
import useWhatsAppCartShare from '../../hooks/useWhatsAppCartShare.js'
import { useAppDispatch, useAppSelector } from '../../redux/hooks.js'
import {
  clearCartLocal,
  selectCartDeliveryFee,
  selectCartItems,
  selectCartSubtotal,
  selectCartTotal,
} from '../../redux/cartSlice.js'
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
  const deliveryCharge = useAppSelector(selectCartDeliveryFee)
  const total = useAppSelector(selectCartTotal)
  const addressesState = useAsync(getAddresses, [])
  const slotsState = useAsync(getDeliverySlots, [])
  const paymentConfigState = useAsync(getPaymentConfig, [])
  const paymentEnabled = Boolean(paymentConfigState.data?.enabled)

  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [selectedSlotId, setSelectedSlotId] = useState(null)
  const [deliveryInstructions, setDeliveryInstructions] = useState('')
  const [addressConfirmed, setAddressConfirmed] = useState(false)
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
    setAddressConfirmed(false)
  }, [selectedAddressId, selectedSlotId])

  useEffect(() => {
    if (!paymentEnabled && paymentMethod === 'razorpay') {
      setPaymentMethod('cod')
    }
  }, [paymentEnabled, paymentMethod])

  const selectedSlot = useMemo(
    () => slots.find((slot) => slot.id === selectedSlotId),
    [slots, selectedSlotId],
  )
  const selectedAddress = useMemo(
    () => addresses.find((address) => address.id === selectedAddressId),
    [addresses, selectedAddressId],
  )
  const { shareCart } = useWhatsAppCartShare(
    selectedSlot || selectedAddress
      ? {
          date: selectedSlot?.date,
          dateLabel: selectedSlot?.dateLabel,
          timeSlot: selectedSlot?.timeSlot,
          address: selectedAddress,
          instructions: deliveryInstructions,
        }
      : null,
  )
  const placeOrderDisabled =
    !selectedAddressId ||
    !selectedSlot ||
    !addressConfirmed ||
    submitting ||
    (paymentMethod === 'razorpay' && !paymentEnabled)
  const placeOrderLabel = submitting
    ? 'Creating order…'
    : paymentMethod === 'razorpay'
      ? 'Pay with Razorpay'
      : 'Place order'

  const handlePlaceOrder = async () => {
    if (!selectedAddressId || !selectedSlot || !addressConfirmed || submitting) return
    if (paymentMethod === 'razorpay' && !paymentEnabled) return

    setSubmitting(true)
    setOrderError('')

    const payload = {
      addressId: selectedAddressId,
      paymentMethod,
      deliveryDate: selectedSlot.date,
      deliverySlot: selectedSlot.label,
      deliveryInstructions,
      addressConfirmed: true,
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
      <div className="mx-auto max-w-7xl px-4 pb-32 pt-8 sm:px-6 lg:pb-8">
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
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-text-primary">
                  2. Delivery time
                </h2>
                <p className="mt-1 text-xs text-text-secondary">
                  Choose Instant for 20–30 min delivery, or pick a scheduled day and time.
                </p>
              </div>
              {slotsState.isLoading && <SkeletonLine className="h-24 w-full rounded-2xl" />}
              {slotsState.isError && <ErrorState message={slotsState.error} onRetry={slotsState.refetch} />}
              <DeliverySlotPicker
                slots={slots}
                selectedId={selectedSlotId}
                onSelect={(slot) => setSelectedSlotId(slot.id)}
              />
              <div className="mt-3 rounded-2xl border border-brand-secondary bg-brand-secondary/30 p-4">
                <div className="flex items-start gap-3">
                  <Clock3 size={18} className="mt-0.5 shrink-0 text-brand-primary" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-text-primary">
                      {selectedSlot
                        ? `Arriving ${selectedSlot.label.toLowerCase()}`
                        : 'Choose a delivery slot'}
                    </p>
                    <p className="mt-1 break-words text-xs text-text-secondary">
                      {selectedAddress
                        ? `${selectedAddress.addressLine}, ${selectedAddress.city} ${selectedAddress.pincode}`
                        : 'Select a delivery address above.'}
                    </p>
                  </div>
                </div>
                <label className="mt-4 flex items-start gap-2 text-xs leading-5 text-text-primary">
                  <input
                    type="checkbox"
                    checked={addressConfirmed}
                    onChange={(event) => setAddressConfirmed(event.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-app-border text-brand-primary focus:ring-brand-primary"
                  />
                  <span>
                    I confirm this delivery address, date and time slot are correct.
                  </span>
                </label>
                <label htmlFor="delivery-instructions" className="mt-4 block text-xs font-semibold text-text-primary">
                  Delivery instructions <span className="font-normal text-text-secondary">(optional)</span>
                </label>
                <select
                  id="delivery-instructions"
                  value={deliveryInstructions}
                  onChange={(event) => setDeliveryInstructions(event.target.value)}
                  className="mt-1.5 h-10 w-full rounded-xl border border-app-border bg-surface px-3 text-sm outline-none focus:border-brand-primary"
                >
                  <option value="">No instructions</option>
                  <option value="Leave at the door">Leave at the door</option>
                  <option value="Don't ring the bell">Don't ring the bell</option>
                  <option value="Call on arrival">Call on arrival</option>
                  <option value="Hand over to security">Hand over to security</option>
                </select>
              </div>
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
                      UPI, card or net banking
                    </span>
                    <span className="mt-2 block text-xs text-text-secondary">
                      Pay securely with Razorpay.
                    </span>
                    <span className="mt-3 flex flex-wrap gap-1.5">
                      {['Google Pay', 'PhonePe', 'Super.Money', 'Paytm'].map((app) => (
                        <span
                          key={app}
                          className="rounded-full border border-app-border bg-surface px-2 py-1 text-[11px] font-medium text-text-secondary"
                        >
                          {app}
                        </span>
                      ))}
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
              <p className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                <Info size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span>
                  UPI apps open only on a <strong>mobile browser with live Razorpay keys</strong>.
                  On desktop, scan the QR code in the Razorpay window. In test mode, use a
                  test UPI ID instead of a real payment app.
                </span>
              </p>
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
              delivery={selectedSlot}
              address={selectedAddress}
              action={
                <div className="space-y-2">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handlePlaceOrder}
                    disabled={placeOrderDisabled}
                  >
                    <ShieldCheck size={16} aria-hidden="true" />
                    {placeOrderLabel}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={shareCart}
                  >
                    <WhatsAppIcon className="h-4 w-4" />
                    Share cart on WhatsApp
                  </Button>
                  {!addressConfirmed && (
                    <p className="text-center text-xs text-text-secondary">
                      Confirm your delivery address to place the order.
                    </p>
                  )}
                </div>
              }
              note={
                paymentMethod === 'razorpay'
                  ? `Your ${selectedSlot ? selectedSlot.label.toLowerCase() : 'selected'} delivery slot and instructions are saved before Razorpay opens.`
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

      {/* Sticky mobile CTA so payment is always reachable without scrolling past every step. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-app-border bg-surface/95 px-4 pb-safe pt-3 shadow-[0_-8px_24px_rgba(16,92,54,0.08)] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="min-w-0">
            <p className="text-xs text-text-secondary">Order total</p>
            <p className="text-lg font-bold text-text-primary">
              {formatCurrency(total)}
            </p>
          </div>
          <Button
            className="ml-auto flex-1 sm:max-w-xs"
            size="lg"
            onClick={handlePlaceOrder}
            disabled={placeOrderDisabled}
          >
            <ShieldCheck size={16} aria-hidden="true" />
            {placeOrderLabel}
          </Button>
        </div>
        {orderError && (
          <p className="mx-auto mt-1 max-w-7xl text-center text-xs text-red-600" role="alert">
            {orderError}
          </p>
        )}
      </div>
    </>
  )
}
