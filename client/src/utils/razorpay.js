const CHECKOUT_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js'

// Follow Razorpay's recommended ordering: top UPI intent apps first, with the
// remaining default methods (cards, netbanking, UPI ID/QR) still available.
// Shortcodes are from Razorpay's "Android Mobile Web" supported apps list.
const CHECKOUT_CONFIG = {
  display: {
    blocks: {
      upiApps: {
        name: 'Pay with UPI apps',
        instruments: [
          {
            method: 'upi',
            apps: [
              'google_pay',
              'phonepe',
              'super_money',
              'paytm',
              'bhim',
            ],
          },
        ],
      },
    },
    sequence: ['block.upiApps'],
    preferences: {
      show_default_blocks: true,
    },
  },
}

let scriptPromise = null

export const loadRazorpayScript = () => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Payments can only start in a browser.'))
  }
  if (window.Razorpay) return Promise.resolve(true)
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = CHECKOUT_SCRIPT
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => {
      scriptPromise = null
      script.remove()
      reject(new Error('Razorpay checkout could not be loaded. Check your connection.'))
    }
    document.body.appendChild(script)
  })

  return scriptPromise
}

/**
 * Opens the official Razorpay checkout. It resolves after the modal closes or a
 * callback finishes; it never assumes success until the server verifies payment.
 */
export const openRazorpayCheckout = async ({
  payment,
  prefill = {},
  onSuccess,
  onFailure,
  onDismiss,
}) => {
  await loadRazorpayScript()

  if (typeof window.Razorpay !== 'function') {
    throw new Error('Razorpay checkout is unavailable in this browser.')
  }

  return new Promise(async (resolve) => {
    let settled = false

    const runFailure = async (error) => {
      if (settled) return
      settled = true
      try {
        await onFailure?.(error)
      } finally {
        resolve({ failed: true, error })
      }
    }

    const checkout = new window.Razorpay({
      key: payment.keyId,
      amount: payment.amount,
      currency: payment.currency || 'INR',
      name: 'FreshCart',
      description: `Order ${payment.orderNumber}`,
      order_id: payment.razorpayOrderId,
      prefill,
      config: CHECKOUT_CONFIG,
      notes: {
        orderId: payment.orderId,
        orderNumber: payment.orderNumber,
        ...(payment.deliverySlot
          ? { deliverySlot: payment.deliverySlot }
          : {}),
        ...(payment.deliveryInstructions
          ? { deliveryInstructions: payment.deliveryInstructions }
          : {}),
      },
      theme: { color: '#16a34a' },
      modal: {
        ondismiss: () => {
          if (settled) return
          settled = true
          onDismiss?.()
          resolve({ dismissed: true })
        },
      },
      handler: async (response) => {
        if (settled) return
        settled = true
        try {
          const order = await onSuccess?.(response)
          resolve({ success: true, order })
        } catch (error) {
          await onFailure?.(error)
          resolve({ failed: true, error })
        }
      },
    })

    checkout.on('payment.failed', (event) => {
      runFailure(
        new Error(
          event?.error?.description ||
            event?.error?.reason ||
            'Razorpay could not complete this payment.',
        ),
      )
    })

    try {
      checkout.open()
    } catch (error) {
      await runFailure(
        new Error(
          error?.message || 'Razorpay checkout could not be opened on this device.',
        ),
      )
    }
  })
}
