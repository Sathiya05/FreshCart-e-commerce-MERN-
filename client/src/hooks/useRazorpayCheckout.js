import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { selectCurrentUser } from '../redux/authSlice.js'
import { fetchCustomerCart } from '../redux/cartSlice.js'
import { useAppDispatch, useAppSelector } from '../redux/hooks.js'
import { pushToast } from '../redux/uiSlice.js'
import { verifyPayment } from '../services/commerce.service.js'
import { openRazorpayCheckout } from '../utils/razorpay.js'

export default function useRazorpayCheckout() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const user = useAppSelector(selectCurrentUser)
  const activeRef = useRef(false)

  return async (payment) => {
    if (activeRef.current) {
      return { failed: true, error: new Error('Payment already in progress.') }
    }
    activeRef.current = true

    // Razorpay can invoke a callback more than once on reconnect/retry.
    let callbackHandled = false
    const once = (handler) => (...args) => {
      if (callbackHandled) return undefined
      callbackHandled = true
      return handler(...args)
    }
    // buildPaymentPayload uses `orderId` for the internal order id and
    // `razorpayOrderId` for the provider id. Prefer the internal id so failure
    // and retry links open a real order via getOrderById().
    const orderReference = payment?.orderId || payment?.id || payment?.orderNumber

    try {
      return await openRazorpayCheckout({
        payment,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        onSuccess: once(async (response) => {
          const order = await verifyPayment({
            orderId: payment.orderId,
            ...response,
          })
          // Payment is confirmed: only now does the server remove the purchased
          // products. Refresh from MongoDB so the cart shows what remains.
          await dispatch(fetchCustomerCart())
          dispatch(
            pushToast({
              title: 'Payment confirmed',
              message: `${order.orderNumber || payment.orderNumber} is paid.`,
            }),
          )
          navigate(`/order-confirmation/${order.id || orderReference}`)
          return order
        }),
        onFailure: once((error) => {
          const message = error?.message || 'Razorpay could not complete this payment.'
          dispatch(
            pushToast({
              type: 'error',
              title: 'Payment not completed',
              message,
            }),
          )
          navigate(
            `/payment/failure?order=${orderReference}&reason=${encodeURIComponent(message)}`,
          )
        }),
        onDismiss: once(() => {
          dispatch(
            pushToast({
              type: 'info',
              title: 'Payment left open',
              message: 'You can retry from the order details page.',
            }),
          )
          navigate(`/account/orders/${orderReference}`)
        }),
      })
    } catch (error) {
      const message = error?.message || 'Could not start the payment checkout.'
      dispatch(
        pushToast({ type: 'error', title: 'Payment unavailable', message }),
      )
      return { failed: true, error }
    } finally {
      activeRef.current = false
    }
  }
}
