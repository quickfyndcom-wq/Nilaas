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
}) {
  return new Promise(async (resolve, reject) => {
    const ready = await loadRazorpayScript()
    if (!ready || !window.Razorpay) {
      reject(new Error('Unable to load Razorpay. Please try again.'))
      return
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
          if (onSuccess) await onSuccess(response)
          resolve(response)
        } catch (err) {
          reject(err)
        }
      },
      modal: {
        ondismiss: () => {
          if (onDismiss) onDismiss()
          reject(new Error('Payment cancelled'))
        },
      },
    })

    rzp.on('payment.failed', (response) => {
      reject(new Error(response?.error?.description || 'Payment failed'))
    })

    rzp.open()
  })
}
