import { useNavigate } from 'react-router-dom'
import { selectCurrentUser } from '../redux/authSlice.js'
import { useAppDispatch, useAppSelector } from '../redux/hooks.js'
import { pushToast } from '../redux/uiSlice.js'
import { verifyPayment } from '../services/commerce.service.js'
import { openRazorpayCheckout } from '../utils/razorpay.js'

export default function useRazorpayCheckout() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const user = useAppSelector(selectCurrentUser)

  return async (payment) => {
    try {
      return await openRazorpayCheckout({
        payment,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        onSuccess: async (response) => {
          const order = await verifyPayment({
            orderId: payment.orderId,
            ...response,
          })
          dispatch(
            pushToast({
              title: 'Payment confirmed',
              message: `${order.orderNumber || payment.orderNumber} is paid.`,
            }),
          )
          navigate(`/order-confirmation/${order.id || payment.orderId}`)
          return order
        },
        onFailure: (error) => {
          const message = error?.message || 'Razorpay could not complete this payment.'
          dispatch(
            pushToast({
              type: 'error',
              title: 'Payment not completed',
              message,
            }),
          )
          navigate(
            `/payment/failure?order=${payment.orderId}&reason=${encodeURIComponent(message)}`,
          )
        },
        onDismiss: () => {
          dispatch(
            pushToast({
              type: 'info',
              title: 'Payment left open',
              message: 'You can retry from the order details page.',
            }),
          )
          navigate(`/account/orders/${payment.orderId}`)
        },
      })
    } catch (error) {
      const message = error?.message || 'Could not start the payment checkout.'
      dispatch(
        pushToast({ type: 'error', title: 'Payment unavailable', message }),
      )
      return { failed: true, error }
    }
  }
}
