import { useAppDispatch, useAppSelector } from '../redux/hooks.js'
import {
  selectCartDeliveryFee,
  selectCartItems,
  selectCartSubtotal,
  selectCartTotal,
} from '../redux/cartSlice.js'
import { pushToast } from '../redux/uiSlice.js'
import { buildWhatsAppCartUrl } from '../utils/whatsapp.js'

const PHONE = String(import.meta.env.VITE_WHATSAPP_PHONE || '').replace(/\D/g, '')

export default function useWhatsAppCartShare(delivery = null) {
  const dispatch = useAppDispatch()
  const items = useAppSelector(selectCartItems)
  const subtotal = useAppSelector(selectCartSubtotal)
  const deliveryFee = useAppSelector(selectCartDeliveryFee)
  const total = useAppSelector(selectCartTotal)

  const shareCart = () => {
    const url = buildWhatsAppCartUrl(PHONE, {
      items,
      subtotal,
      deliveryFee,
      total,
      delivery,
    })

    if (!url) {
      dispatch(
        pushToast({
          type: 'info',
          title: 'WhatsApp unavailable',
          message: !PHONE
            ? 'No WhatsApp business number is configured. Please contact FreshCart support.'
            : 'Add items to your cart before sharing it on WhatsApp.',
        }),
      )
      return
    }

    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return { shareCart, phone: PHONE }
}
