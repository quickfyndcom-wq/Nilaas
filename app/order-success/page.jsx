'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { useAuth } from '@/lib/useAuth'
import Link from 'next/link'
import Image from 'next/image'
import { Check, Copy, Package } from 'lucide-react'

import { getPublicOrderNumber } from '@/lib/orderNumber'

function getItemName(item) {
  return (
    item?.name ||
    item?.product?.name ||
    item?.productId?.name ||
    'Item'
  )
}

function getItemImage(item) {
  const img =
    item?.image ||
    item?.product?.images?.[0] ||
    item?.productId?.images?.[0]
  if (typeof img === 'string' && img.trim()) return img
  if (img?.url) return img.url
  return null
}

function formatInr(amount, currency = '₹') {
  return `${currency}${Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`
}

export default function OrderSuccess() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center bg-white text-sm text-[#9a7d72]">
          Loading confirmation…
        </div>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  )
}

function OrderSuccessContent() {
  const params = useSearchParams()
  const router = useRouter()
  const [orders, setOrders] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const { user, loading: authLoading, getToken } = useAuth()

  useEffect(() => {
    const fetchOrder = async (orderId) => {
      try {
        const fetchOptions = {}
        if (user && getToken) {
          const token = await getToken()
          fetchOptions.headers = { Authorization: `Bearer ${token}` }
        }
        const res = await fetch(`/api/orders?orderId=${orderId}`, fetchOptions)
        const data = await res.json()
        if (data.orders && Array.isArray(data.orders)) {
          setOrders(data.orders)
        } else if (data.order) {
          setOrders([data.order])
        } else {
          setOrders(null)
        }
      } catch {
        setOrders(null)
      } finally {
        setLoading(false)
      }
    }

    if (authLoading) return
    const orderId = params.get('orderId')
    if (!orderId) {
      router.replace('/')
      return
    }
    fetchOrder(orderId)
  }, [params, router, user, authLoading, getToken])

  const order = orders?.[0] || null
  const orderNo = getPublicOrderNumber(order)
  const products = order?.orderItems || []
  const subtotal = products.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0
  )
  const shipping = typeof order?.shippingFee === 'number' ? order.shippingFee : 0
  const discount = order?.coupon?.discount
    ? order.coupon.discountType === 'percentage'
      ? (order.coupon.discount / 100) * subtotal
      : Math.min(order.coupon.discount, subtotal)
    : 0
  const total = Math.max(0, subtotal + shipping - discount)
  const orderDate = order?.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : ''
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || order?.currency || '₹'
  const paymentLabel =
    order?.paymentMethod === 'RAZORPAY'
      ? 'Online (Razorpay)'
      : order?.paymentMethod || 'COD'

  useEffect(() => {
    if (order && typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Purchase', { value: total, currency: 'INR' })
    }
  }, [order, total])

  const copyOrderNo = async () => {
    try {
      await navigator.clipboard.writeText(orderNo)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center bg-white text-sm text-[#9a7d72]">
        Loading confirmation…
      </div>
    )
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="min-h-[55vh] flex items-center justify-center bg-white px-4 py-16">
        <div className="max-w-md w-full border border-[#2a1210]/10 px-8 py-12 text-center">
          <p className="text-[11px] tracking-[0.28em] uppercase text-[#8a5a4a] mb-3">Nilaas</p>
          <h1 className="font-serif text-2xl text-[#2a1210] mb-3">Order not found</h1>
          <p className="text-sm text-[#6e5048] mb-8">
            We couldn’t load this confirmation. Check My Orders or contact support.
          </p>
          <Link
            href="/shop"
            className="inline-flex h-12 px-6 bg-[#2a1210] text-[#faf7f4] text-sm font-semibold tracking-wide hover:bg-[#4a221c] transition items-center"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-[#2a1210]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-[11px] tracking-[0.28em] uppercase text-[#8a5a4a] mb-4">Nilaas</p>
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center border border-[#2a1210] bg-[#2a1210] text-[#faf7f4]">
            <Check size={28} strokeWidth={2.5} />
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#2a1210] mb-2">Thank you</h1>
          <p className="text-sm sm:text-base text-[#6e5048]">
            Your order has been received and is being prepared.
          </p>
        </div>

        {/* Order number */}
        <div className="border border-[#2a1210]/12 px-6 py-8 text-center mb-6">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#9a7d72] mb-2">Order ID</p>
          <p className="font-serif text-4xl sm:text-5xl tracking-wide text-[#2a1210] mb-3">
            {orderNo}
          </p>
          <button
            type="button"
            onClick={copyOrderNo}
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-[#6b2f28] hover:text-[#2a1210] transition"
          >
            <Copy size={12} />
            {copied ? 'Copied' : 'Copy order ID'}
          </button>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-[#2a1210]/10 border border-[#2a1210]/10 mb-8">
          <div className="bg-white p-5 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-[#9a7d72]">Order ID</span>
              <span className="font-medium tabular-nums">{orderNo}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-[#9a7d72]">Order date</span>
              <span className="font-medium">{orderDate}</span>
            </div>
          </div>
          <div className="bg-white p-5 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-[#9a7d72]">Total</span>
              <span className="font-semibold tabular-nums">{formatInr(total, currency)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-[#9a7d72]">Payment</span>
              <span className="font-medium">{paymentLabel}</span>
            </div>
          </div>
        </div>

        {/* Items */}
        <section className="border border-[#2a1210]/10 mb-6">
          <div className="px-5 py-4 border-b border-[#2a1210]/10">
            <h2 className="font-serif text-xl text-[#2a1210]">Order summary</h2>
          </div>

          <div className="divide-y divide-[#2a1210]/08">
            {products.map((item, idx) => {
              const name = getItemName(item)
              const image = getItemImage(item)
              const line = Number(item.price || 0) * Number(item.quantity || 0)
              return (
                <div key={item._id || idx} className="flex gap-4 px-5 py-4">
                  <div className="relative w-16 h-20 shrink-0 overflow-hidden bg-[#f3f0ee] border border-[#2a1210]/08">
                    {image ? (
                      <Image
                        src={image}
                        alt={name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-[#9a7d72]">
                        <Package size={18} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
                    <div>
                      <p className="font-serif text-base text-[#2a1210] leading-snug line-clamp-2">
                        {name}
                      </p>
                      <p className="text-xs text-[#9a7d72] mt-1">Qty: {item.quantity || 1}</p>
                    </div>
                    <p className="text-sm font-semibold tabular-nums shrink-0">
                      {formatInr(line, currency)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="border-t border-[#2a1210]/10 px-5 py-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#6e5048]">Items</span>
              <span className="tabular-nums">{formatInr(subtotal, currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6e5048]">Discount</span>
              <span className="tabular-nums">
                −{formatInr(discount, currency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6e5048]">Shipping &amp; handling</span>
              <span className="tabular-nums">
                {shipping === 0 ? 'FREE' : formatInr(shipping, currency)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[#2a1210]/10 font-semibold text-base">
              <span>Total</span>
              <span className="tabular-nums">{formatInr(total, currency)}</span>
            </div>
          </div>
        </section>

        {/* Note */}
        <div className="border border-[#2a1210]/15 px-5 py-4 mb-8 text-sm text-[#6b2f28] leading-relaxed">
          {user ? (
            <>
              A confirmation email is on its way. You can track this order anytime from{' '}
              <Link href="/orders" className="underline underline-offset-2 text-[#2a1210]">
                My orders
              </Link>
              .
            </>
          ) : (
            <>
              Please sign in to view your full order history. Guests can track using the order
              number above. Questions?{' '}
              <a href="mailto:support@nilaas.in" className="underline underline-offset-2 text-[#2a1210]">
                support@nilaas.in
              </a>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={user ? '/orders' : `/track-order?orderId=${order?._id || ''}`}
            className="inline-flex h-12 px-6 border border-[#2a1210] text-[#2a1210] text-sm font-semibold tracking-wide hover:bg-[#2a1210] hover:text-[#faf7f4] transition items-center justify-center"
          >
            {user ? 'View my orders' : 'Track order'}
          </Link>
          <button
            type="button"
            onClick={() => router.push('/shop')}
            className="inline-flex h-12 px-6 bg-[#2a1210] text-[#faf7f4] text-sm font-semibold tracking-wide hover:bg-[#4a221c] transition items-center justify-center"
          >
            Continue shopping
          </button>
        </div>
      </div>
    </div>
  )
}
