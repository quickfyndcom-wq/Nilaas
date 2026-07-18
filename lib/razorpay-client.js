export function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false)
      return
    }
    if (window.Razorpay) {
      resolve(true)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export function openRazorpayCheckout({
  key,
  amount,
  currency = 'INR',
  orderId,
  name = 'Nilaas',
  description = 'Order payment',
  prefill = {},
  onSuccess,
  onDismiss,
  onFailed,
}) {
  return new Promise(async (resolve, reject) => {
    const ready = await loadRazorpayScript()
    if (!ready || !window.Razorpay) {
      reject(new Error('Unable to load Razorpay. Please try again.'))
      return
    }

    let settled = false
    const finishReject = async (err, meta = {}) => {
      if (settled) return
      settled = true
      try {
        if (meta.type === 'dismiss' && onDismiss) await onDismiss(err)
        if (meta.type === 'failed' && onFailed) await onFailed(err, meta.response)
      } catch {}
      reject(err instanceof Error ? err : new Error(String(err || 'Payment failed')))
    }

    const rzp = new window.Razorpay({
      key,
      amount,
      currency,
      name,
      description,
      order_id: orderId,
      prefill,
      theme: { color: '#2a1210' },
      handler: async (response) => {
        try {
          settled = true
          if (onSuccess) await onSuccess(response)
          resolve(response)
        } catch (err) {
          reject(err)
        }
      },
      modal: {
        ondismiss: () => {
          finishReject(new Error('Payment cancelled'), { type: 'dismiss' })
        },
      },
    })

    rzp.on('payment.failed', (response) => {
      const message =
        response?.error?.description ||
        response?.error?.reason ||
        'Payment failed'
      finishReject(new Error(message), { type: 'failed', response })
    })

    rzp.open()
  })
}
