'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { Package, Truck, RotateCcw } from 'lucide-react'
import Loading from '@/components/Loading'
import { useAuth } from '@/lib/useAuth'
import { getPublicOrderNumber } from '@/lib/orderNumber'
import { ORDER_STATUSES } from '@/lib/order-status'

const FILTERS = [
  { id: 'ALL', label: 'All' },
  { id: 'PLACED', label: 'Placed' },
  { id: 'SHIPPING', label: 'Shipping' },
  { id: 'DELIVERED', label: 'Delivered' },
  { id: 'RETURNED', label: 'Returned' },
  { id: 'CANCELLED', label: 'Cancelled' },
]

const PLACED = new Set(['PAYMENT_PENDING', 'ORDER_PLACED', 'CONFIRMED', 'PROCESSING'])
const SHIPPING = new Set([
  'MANIFESTED',
  'PICKUP_REQUESTED',
  'WAITING_FOR_PICKUP',
  'PICKED_UP',
  'WAREHOUSE_RECEIVED',
  'SHIPPED',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'UNDELIVERED',
])
const RETURNED = new Set(['RETURN_REQUESTED', 'RETURNED', 'RTO'])
const CANCELLED = new Set(['CANCELLED', 'PAYMENT_FAILED'])

function matchesFilter(status, filterId) {
  const s = String(status || '').toUpperCase()
  if (filterId === 'ALL') return true
  if (filterId === 'PLACED') return PLACED.has(s)
  if (filterId === 'SHIPPING') return SHIPPING.has(s)
  if (filterId === 'DELIVERED') return s === 'DELIVERED'
  if (filterId === 'RETURNED') return RETURNED.has(s)
  if (filterId === 'CANCELLED') return CANCELLED.has(s)
  return true
}

function statusLabel(status) {
  return ORDER_STATUSES.find((s) => s.value === status)?.label || status || '—'
}

function statusTone(status) {
  const s = String(status || '').toUpperCase()
  if (s === 'DELIVERED') return 'text-emerald-700 bg-emerald-50'
  if (SHIPPING.has(s)) return 'text-blue-800 bg-blue-50'
  if (RETURNED.has(s)) return 'text-orange-800 bg-orange-50'
  if (CANCELLED.has(s)) return 'text-red-700 bg-red-50'
  if (s === 'PAYMENT_PENDING') return 'text-amber-800 bg-amber-50'
  return 'text-[#2a1210] bg-[#f5ebe4]'
}

function paymentLabel(order) {
  const method = String(order?.paymentMethod || '').toUpperCase()
  if (method === 'COD') return 'Cash on delivery'
  if (order?.isPaid || order?.paymentStatus === 'paid') return `${method} · Paid`
  if (order?.paymentStatus === 'failed' || order?.status === 'PAYMENT_FAILED') {
    return `${method || 'Online'} · Failed`
  }
  if (order?.status === 'PAYMENT_PENDING') return `${method || 'Online'} · Pending`
  return method || '—'
}

function itemName(item) {
  return item?.name || item?.productId?.name || item?.product?.name || 'Item'
}

function itemImage(item) {
  const img =
    item?.image || item?.productId?.images?.[0] || item?.product?.images?.[0]
  if (typeof img === 'string' && img.trim()) return img
  if (img?.url) return img.url
  return null
}

function formatAddress(addr = {}) {
  const lines = [
    addr.name,
    [addr.street || addr.address, addr.city].filter(Boolean).join(', '),
    [addr.state, addr.zip || addr.pincode, addr.country || 'India']
      .filter(Boolean)
      .join(', '),
    addr.phone ? `Phone: ${addr.phone}` : null,
  ].filter(Boolean)
  return lines
}

export default function OrdersClient({ embedded = false }) {
  const { user, loading: authLoading, getToken } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const router = useRouter()

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      setLoading(false)
      toast.error('Please sign in to view your orders')
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('openSignInModal'))
      }
      router.replace('/')
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const token = await getToken()
        if (!token) {
          toast.error('Could not verify sign-in (try again in a minute).')
          if (!cancelled) setLoading(false)
          return
        }
        const { data } = await axios.get('/api/orders', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!cancelled) setOrders(Array.isArray(data?.orders) ? data.orders : [])
      } catch (error) {
        console.error('My Orders fetch error:', error?.response?.data || error.message)
        toast.error(error?.response?.data?.error || 'Failed to load orders')
        if (!cancelled) setOrders([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [authLoading, user, getToken, router])

  const filterCounts = useMemo(() => {
    const counts = Object.fromEntries(FILTERS.map((f) => [f.id, 0]))
    counts.ALL = orders.length
    for (const o of orders) {
      for (const f of FILTERS) {
        if (f.id === 'ALL') continue
        if (matchesFilter(o.status, f.id)) counts[f.id] += 1
      }
    }
    return counts
  }, [orders])

  const filteredOrders = useMemo(
    () => orders.filter((o) => matchesFilter(o.status, filter)),
    [orders, filter]
  )

  if (authLoading || loading) return <Loading />

  if (!user) {
    return (
      <div className="py-16 text-center">
        <p className="text-[#6b2f28]">Please sign in to view your orders.</p>
      </div>
    )
  }

  return (
    <div className={embedded ? '' : 'mx-auto min-h-[70vh] max-w-3xl px-4 py-10'}>
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-[#2a1210] sm:text-2xl">My Orders</h1>
        <p className="mt-1 text-sm text-[#6b2f28]">
          {orders.length === 0
            ? 'No orders yet'
            : `${filteredOrders.length} of ${orders.length} order${orders.length === 1 ? '' : 's'}`}
        </p>
      </div>

      {orders.length > 0 && (
        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => {
            const count = filterCounts[f.id] || 0
            if (f.id !== 'ALL' && count === 0) return null
            const active = filter === f.id
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`shrink-0 rounded-full px-3.5 py-2 text-sm ${
                  active
                    ? 'bg-[#2a1210] text-[#f5ebe4]'
                    : 'border border-[#2a1210]/15 bg-white text-[#6b2f28]'
                }`}
              >
                {f.label} ({count})
              </button>
            )
          })}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="rounded-xl border border-[#2a1210]/10 bg-white px-6 py-14 text-center">
          <Package className="mx-auto mb-3 text-[#9a7d72]" size={36} />
          <p className="font-medium text-[#2a1210]">No orders yet</p>
          <Link
            href="/products"
            className="mt-5 inline-block rounded-lg bg-[#2a1210] px-5 py-2.5 text-sm text-[#f5ebe4]"
          >
            Shop now
          </Link>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-xl border border-[#2a1210]/10 bg-white px-6 py-10 text-center">
          <p className="text-sm text-[#6b2f28]">No orders in this filter.</p>
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className="mt-3 text-sm underline text-[#2a1210]"
          >
            Show all
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const id = order._id || order.id
            const items = order.orderItems || order.items || []
            const awb = order.delhiveryWaybill || order.trackingId
            const addr = order.shippingAddress || order.addressId || {}
            const addressLines = formatAddress(addr)
            const status = String(order.status || '').toUpperCase()
            const canReturn = status === 'DELIVERED'
            const canTrack = Boolean(awb || order.trackingUrl)

            return (
              <article
                key={id}
                className="rounded-xl border border-[#2a1210]/10 bg-white overflow-hidden"
              >
                {/* Header: ID + one status */}
                <div className="flex items-start justify-between gap-3 px-4 py-3 sm:px-5">
                  <div>
                    <p className="font-mono text-sm font-semibold text-[#2a1210]">
                      #{getPublicOrderNumber(order)}
                    </p>
                    <p className="mt-0.5 text-xs text-[#9a7d72]">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : ''}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone(status)}`}
                  >
                    {statusLabel(status)}
                  </span>
                </div>

                {/* Items */}
                <div className="space-y-3 border-t border-[#2a1210]/08 px-4 py-3 sm:px-5">
                  {items.map((item, idx) => {
                    const img = itemImage(item)
                    return (
                      <div key={idx} className="flex gap-3">
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-[#f5ebe4]">
                          {img ? (
                            <Image src={img} alt="" fill className="object-cover" sizes="64px" />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1 py-0.5">
                          <p className="text-sm font-medium leading-snug text-[#2a1210]">
                            {itemName(item)}
                          </p>
                          <p className="mt-1 text-xs text-[#6b2f28]">
                            Qty {item.quantity || 1}
                            {item.price != null
                              ? ` · ₹${Number(item.price).toLocaleString('en-IN')}`
                              : ''}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Details — simple rows */}
                <div className="space-y-2 border-t border-[#2a1210]/08 px-4 py-3 text-sm sm:px-5">
                  <div className="flex justify-between gap-3">
                    <span className="text-[#9a7d72]">Total</span>
                    <span className="font-semibold text-[#2a1210]">
                      ₹{Number(order.total || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-[#9a7d72]">Payment</span>
                    <span className="text-right text-[#2a1210]">{paymentLabel(order)}</span>
                  </div>
                  {awb && (
                    <div className="flex justify-between gap-3">
                      <span className="text-[#9a7d72]">AWB</span>
                      <span className="font-mono text-xs text-[#2a1210]">{awb}</span>
                    </div>
                  )}
                </div>

                {/* Address */}
                {addressLines.length > 0 && (
                  <div className="border-t border-[#2a1210]/08 px-4 py-3 sm:px-5">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[#9a7d72]">
                      Shipping address
                    </p>
                    {addressLines.map((line, i) => (
                      <p key={i} className="text-sm leading-relaxed text-[#6b2f28]">
                        {line}
                      </p>
                    ))}
                  </div>
                )}

                {/* Actions */}
                {(canTrack || canReturn) && (
                  <div className="flex flex-wrap gap-2 border-t border-[#2a1210]/08 px-4 py-3 sm:px-5">
                    {canTrack &&
                      (order.trackingUrl ? (
                        <a
                          href={order.trackingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#2a1210] px-3.5 py-2 text-xs font-medium text-[#f5ebe4]"
                        >
                          <Truck size={14} /> Track shipment
                        </a>
                      ) : (
                        <Link
                          href={`/track-order?orderId=${id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#2a1210] px-3.5 py-2 text-xs font-medium text-[#f5ebe4]"
                        >
                          <Truck size={14} /> Track order
                        </Link>
                      ))}
                    {canReturn && (
                      <Link
                        href={`/return-request?orderId=${id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#2a1210]/20 px-3.5 py-2 text-xs font-medium text-[#2a1210]"
                      >
                        <RotateCcw size={14} /> Return
                      </Link>
                    )}
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
