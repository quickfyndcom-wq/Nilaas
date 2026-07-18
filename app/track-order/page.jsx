'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import Link from 'next/link'
import { getPublicOrderNumber } from '@/lib/orderNumber'
import { SITE } from '@/lib/site'

const PIPELINE = [
  'ORDER_PLACED',
  'PROCESSING',
  'MANIFESTED',
  'PICKED_UP',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
]

function statusColor(status) {
  const s = String(status || '').toUpperCase()
  if (s === 'DELIVERED') return 'bg-emerald-100 text-emerald-800'
  if (s.includes('OUT_FOR_DELIVERY') || /out for delivery/i.test(status)) return 'bg-cyan-100 text-cyan-800'
  if (s.includes('RTO') || s.includes('CANCEL')) return 'bg-rose-100 text-rose-800'
  if (s.includes('TRANSIT') || s.includes('SHIP') || s.includes('MANIFEST') || s.includes('PICK'))
    return 'bg-blue-100 text-blue-800'
  return 'bg-slate-100 text-slate-700'
}

function formatWhen(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return String(iso)
  }
}

function formatDate(value) {
  if (!value) return ''
  try {
    return new Date(value).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return String(value)
  }
}

function TrackOrderPageInner() {
  const [email, setEmail] = useState('')
  const [orderNumber, setOrderNumber] = useState('')
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState(null)
  const [delhivery, setDelhivery] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const orderId = searchParams.get('orderId')
    const awb = searchParams.get('awb')
    if (orderId) setOrderNumber(orderId)
    else if (awb) setOrderNumber(awb)
  }, [searchParams])

  const fetchTracking = useCallback(async ({ silent = false } = {}) => {
    if (!email.trim() || !orderNumber.trim()) return false
    if (silent) setRefreshing(true)
    else setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('email', email.trim())
      params.append('awb', orderNumber.trim())

      const res = await axios.get(`/api/track-order?${params.toString()}`)
      if (res.data.success && res.data.order) {
        setOrder(res.data.order)
        setDelhivery(res.data.delhivery || null)
        setNotFound(false)
        setLastRefreshed(new Date())
        return true
      } else {
        if (!silent) {
          setNotFound(true)
          toast.error('Order not found')
        }
      }
    } catch (error) {
      if (!silent) {
        setNotFound(true)
        toast.error(error.response?.data?.message || 'Order not found')
      }
    } finally {
      if (silent) setRefreshing(false)
      else setLoading(false)
    }
    return false
  }, [email, orderNumber])

  const handleTrack = async (e) => {
    e?.preventDefault?.()
    if (!email.trim() || !orderNumber.trim()) {
      toast.error('Please enter email and Order ID / AWB')
      return
    }

    setNotFound(false)
    setOrder(null)
    setDelhivery(null)
    setLastRefreshed(null)
    await fetchTracking()
  }

  const displayStatus = delhivery?.mappedStatus || order?.status || 'ORDER_PLACED'
  const liveLabel = delhivery?.status || displayStatus.replace(/_/g, ' ')
  const awb = order?.delhiveryWaybill || order?.trackingId
  const pipelineIndex = (() => {
    const idx = PIPELINE.indexOf(String(displayStatus).toUpperCase())
    if (idx >= 0) return idx
    if (/DELIVER/i.test(liveLabel)) return PIPELINE.length - 1
    if (/OUT FOR DELIVERY|OFD/i.test(liveLabel)) return PIPELINE.indexOf('OUT_FOR_DELIVERY')
    if (/TRANSIT|HUB|REACHED|LEFT/i.test(liveLabel)) return PIPELINE.indexOf('IN_TRANSIT')
    if (/PICK/i.test(liveLabel)) return PIPELINE.indexOf('PICKED_UP')
    if (/MANIFEST|SHIP/i.test(liveLabel)) return PIPELINE.indexOf('MANIFESTED')
    return Math.max(0, PIPELINE.indexOf(String(order?.status || '').toUpperCase()))
  })()

  // Keep an active Delhivery shipment current without requiring a page reload.
  useEffect(() => {
    if (!order || String(displayStatus).toUpperCase() === 'DELIVERED') return
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') fetchTracking({ silent: true })
    }, 60 * 1000)
    return () => clearInterval(interval)
  }, [order, displayStatus, fetchTracking])

  return (
    <div className="min-h-screen bg-[#faf7f4] py-10 sm:py-14">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-8">
          <p className="text-[11px] tracking-[0.28em] uppercase text-[#8a5a4a] mb-2">Nilaas</p>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#2a1210] mb-2">Track your order</h1>
          <p className="text-sm text-[#6e5048] max-w-xl mx-auto leading-relaxed">
            Enter your email and Order ID or tracking number / AWB for live courier tracking.
            We ship with Delhivery, India Post, EMS, and DTDC.
          </p>
        </div>

        <div className="bg-white border border-[#2a1210]/10 p-6 mb-8">
          <form onSubmit={handleTrack} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#2a1210] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email used for the order"
                className="w-full px-4 py-3 border border-[#2a1210]/20 focus:border-[#2a1210] outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2a1210] mb-1.5">
                Order ID / Tracking number
              </label>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="e.g. Order ID or Delhivery / India Post / EMS / DTDC AWB"
                className="w-full px-4 py-3 border border-[#2a1210]/20 focus:border-[#2a1210] outline-none text-sm font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2a1210] text-white py-3 text-sm font-semibold uppercase tracking-wide hover:bg-[#4a221c] disabled:opacity-50"
            >
              {loading ? 'Fetching live tracking…' : 'Track order'}
            </button>
          </form>
        </div>

        {notFound && (
          <div className="bg-rose-50 border border-rose-200 p-6 text-center text-sm text-rose-900 mb-8">
            Order not found. Check your email and Order ID / AWB, or{' '}
            <Link href="/contact-us" className="underline font-semibold">
              contact support
            </Link>
            .
          </div>
        )}

        {order && (
          <div className="space-y-5">
            {/* Summary */}
            <div className="bg-white border border-[#2a1210]/10 p-6">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
                <div>
                  <h2 className="font-serif text-2xl text-[#2a1210]">
                    Order {getPublicOrderNumber(order)}
                  </h2>
                  <p className="text-sm text-[#6e5048] mt-1">
                    Placed {new Date(order.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                  </p>
                </div>
                <span className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wide rounded ${statusColor(displayStatus)}`}>
                  {liveLabel}
                </span>
              </div>

              {/* Simplified pipeline */}
              <div className="hidden sm:flex justify-between gap-1 mb-2">
                {PIPELINE.map((step, idx) => {
                  const done = idx <= pipelineIndex
                  return (
                    <div key={step} className="flex-1 flex flex-col items-center min-w-0">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${
                          done
                            ? 'bg-[#2a1210] border-[#2a1210] text-white'
                            : 'bg-white border-[#2a1210]/20 text-[#9a7d72]'
                        }`}
                      >
                        {done ? '✓' : idx + 1}
                      </div>
                      <p className={`text-[9px] mt-1.5 text-center leading-tight ${done ? 'text-[#2a1210] font-semibold' : 'text-[#9a7d72]'}`}>
                        {step.replace(/_/g, ' ')}
                      </p>
                    </div>
                  )
                })}
              </div>
              <p className="sm:hidden text-sm text-[#4a3832]">
                Status: <strong>{liveLabel}</strong>
              </p>
            </div>

            {/* Live Delhivery */}
            <div className="bg-white border border-[#2a1210]/10 p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="font-serif text-xl text-[#2a1210]">Delhivery tracking</h3>
                  {lastRefreshed && (
                    <p className="text-[11px] text-[#9a7d72] mt-1">
                      {refreshing ? 'Checking Delhivery…' : `Auto-updated ${formatWhen(lastRefreshed)}`}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {awb && (
                    <button
                      type="button"
                      onClick={() => fetchTracking({ silent: true })}
                      disabled={refreshing}
                      className="text-xs font-semibold text-[#6b2f28] underline disabled:opacity-50"
                    >
                      {refreshing ? 'Refreshing…' : 'Refresh'}
                    </button>
                  )}
                  {awb ? (
                    <span className="font-mono text-xs bg-[#f3f0ee] text-[#2a1210] px-2.5 py-1">
                      AWB {awb}
                    </span>
                  ) : (
                    <span className="text-xs text-[#9a7d72]">Not shipped yet</span>
                  )}
                </div>
              </div>

              {!awb ? (
                <p className="text-sm text-[#6e5048]">
                  Your order is being prepared. A Delhivery AWB will appear here once it is manifested.
                </p>
              ) : delhivery?.error && !delhivery?.scans?.length ? (
                <div className="space-y-3 text-sm">
                  <p className="text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2">
                    {delhivery.error}. You can still track on Delhivery’s site.
                  </p>
                  {order.trackingUrl && (
                    <a
                      href={order.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex text-[#6b2f28] font-semibold underline"
                    >
                      Open Delhivery tracking →
                    </a>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <div className="bg-[#faf7f4] px-3 py-2.5">
                      <p className="text-[11px] uppercase tracking-wide text-[#9a7d72]">Live status</p>
                      <p className="font-semibold text-[#2a1210] mt-0.5">{delhivery?.status || 'Awaiting first scan'}</p>
                    </div>
                    <div className="bg-[#faf7f4] px-3 py-2.5">
                      <p className="text-[11px] uppercase tracking-wide text-[#9a7d72]">Courier</p>
                      <p className="font-semibold text-[#2a1210] mt-0.5">{order.courier || 'Delhivery'}</p>
                    </div>
                    {delhivery?.location ? (
                      <div className="bg-[#faf7f4] px-3 py-2.5">
                        <p className="text-[11px] uppercase tracking-wide text-[#9a7d72]">Last location</p>
                        <p className="font-semibold text-[#2a1210] mt-0.5">{delhivery.location}</p>
                      </div>
                    ) : null}
                    {delhivery?.statusDate ? (
                      <div className="bg-[#faf7f4] px-3 py-2.5">
                        <p className="text-[11px] uppercase tracking-wide text-[#9a7d72]">Updated</p>
                        <p className="font-semibold text-[#2a1210] mt-0.5">{formatWhen(delhivery.statusDate)}</p>
                      </div>
                    ) : null}
                    {delhivery?.estimatedDelivery ? (
                      <div className="bg-[#f4eee8] px-3 py-2.5">
                        <p className="text-[11px] uppercase tracking-wide text-[#9a7d72]">Expected delivery</p>
                        <p className="font-semibold text-[#2a1210] mt-0.5">
                          {formatDate(delhivery.estimatedDelivery)}
                        </p>
                      </div>
                    ) : null}
                    {delhivery?.destination ? (
                      <div className="bg-[#faf7f4] px-3 py-2.5">
                        <p className="text-[11px] uppercase tracking-wide text-[#9a7d72]">Destination</p>
                        <p className="font-semibold text-[#2a1210] mt-0.5">{delhivery.destination}</p>
                      </div>
                    ) : null}
                  </div>

                  {order.trackingUrl && (
                    <a
                      href={order.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex text-sm font-semibold text-[#6b2f28] underline"
                    >
                      Also open on Delhivery.com →
                    </a>
                  )}

                  <div>
                    <h4 className="text-sm font-semibold text-[#2a1210] mb-3">Scan history</h4>
                    {(delhivery?.scans || []).length === 0 ? (
                      <p className="text-sm text-[#9a7d72]">
                        AWB created — scans will appear once Delhivery picks up the package.
                      </p>
                    ) : (
                      <ol className="relative border-l border-[#2a1210]/15 ml-2 space-y-4">
                        {delhivery.scans.map((scan, i) => (
                          <li key={i} className="pl-5 relative">
                            <span
                              className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ${
                                i === 0 ? 'bg-[#2a1210]' : 'bg-[#c4b5a8]'
                              }`}
                            />
                            <p className={`text-sm ${i === 0 ? 'font-semibold text-[#2a1210]' : 'text-[#4a3832]'}`}>
                              {scan.status}
                            </p>
                            <p className="text-xs text-[#9a7d72] mt-0.5">
                              {[scan.location, formatWhen(scan.at)].filter(Boolean).join(' · ')}
                            </p>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Items */}
            <div className="bg-white border border-[#2a1210]/10 p-6">
              <h3 className="font-serif text-xl text-[#2a1210] mb-4">Items</h3>
              <div className="space-y-3">
                {(order.orderItems || []).map((item, idx) => {
                  const product = item.productId || item.product || {}
                  const name = item.name || product.name || 'Item'
                  const img = product.images?.[0] || item.image
                  return (
                    <div key={idx} className="flex gap-3 pb-3 border-b border-[#2a1210]/08 last:border-0">
                      <div className="w-16 h-20 bg-[#f3f0ee] overflow-hidden shrink-0">
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={img} alt={name} className="w-full h-full object-cover" />
                        ) : null}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[#2a1210] text-sm">{name}</p>
                        <p className="text-xs text-[#6e5048] mt-1">Qty {item.quantity}</p>
                      </div>
                      <p className="text-sm font-semibold text-[#2a1210]">
                        ₹{((item.price || 0) * (item.quantity || 0)).toLocaleString('en-IN')}
                      </p>
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between mt-4 pt-3 border-t border-[#2a1210]/10 font-semibold text-[#2a1210]">
                <span>Total</span>
                <span>₹{(order.total || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {order.shippingAddress && (
              <div className="bg-white border border-[#2a1210]/10 p-6 text-sm text-[#4a3832]">
                <h3 className="font-serif text-xl text-[#2a1210] mb-3">Shipping to</h3>
                <p className="font-medium text-[#2a1210]">{order.shippingAddress.name}</p>
                <p>{order.shippingAddress.street || order.shippingAddress.address}</p>
                <p>
                  {[order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.zip]
                    .filter(Boolean)
                    .join(', ')}
                </p>
                {order.shippingAddress.phone ? <p className="mt-2">Phone: {order.shippingAddress.phone}</p> : null}
              </div>
            )}

            <p className="text-center text-xs text-[#9a7d72]">
              Need help?{' '}
              <Link href="/support" className="underline text-[#6b2f28]">
                Support
              </Link>{' '}
              ·{' '}
              <Link href="/contact-us" className="underline text-[#6b2f28]">
                Contact
              </Link>
            </p>
          </div>
        )}

        {/* Tracking information */}
        <div className="mt-10 border-t border-[#2a1210]/10 pt-10">
          <div className="text-center mb-7">
            <p className="text-[11px] tracking-[0.25em] uppercase text-[#8a5a4a] mb-2">
              Delivery help
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#2a1210]">
              About your shipment
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            {[
              ['1', 'Order confirmed', 'We prepare and quality-check your items before packing.'],
              ['2', 'Handed to courier', 'Your AWB activates after the first pickup scan (Delhivery, India Post, EMS, or DTDC).'],
              ['3', 'Live delivery updates', 'This page refreshes tracking automatically every 60 seconds while open.'],
            ].map(([number, title, text]) => (
              <div key={number} className="bg-white border border-[#2a1210]/10 p-5">
                <span className="w-8 h-8 rounded-full bg-[#2a1210] text-white text-xs font-bold flex items-center justify-center mb-4">
                  {number}
                </span>
                <h3 className="font-semibold text-[#2a1210] text-sm mb-1.5">{title}</h3>
                <p className="text-xs leading-5 text-[#6e5048]">{text}</p>
              </div>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-[#f3ebe4] border border-[#2a1210]/10 p-5">
              <h3 className="font-serif text-lg text-[#2a1210] mb-2">Tracking not updated?</h3>
              <p className="text-sm leading-6 text-[#6e5048]">
                A new shipment can take several hours to receive its first scan. Updates from
                Delhivery, India Post, EMS, or DTDC may also appear after the parcel reaches the next facility.
              </p>
            </div>
            <div className="bg-[#2a1210] text-white p-5">
              <h3 className="font-serif text-lg mb-2">Need delivery support?</h3>
              <p className="text-sm leading-6 text-white/75 mb-3">
                Keep your Order ID and AWB ready so our team can help quickly.
              </p>
              <div className="flex flex-wrap gap-4 text-sm font-semibold">
                <a href={`https://wa.me/${SITE.whatsapp}`} target="_blank" rel="noopener noreferrer" className="underline">
                  WhatsApp us
                </a>
                <Link href="/contact-us" className="underline">Contact support</Link>
              </div>
            </div>
          </div>

          <p className="text-center text-[11px] leading-5 text-[#9a7d72] mt-5">
            For your privacy, order details are shown only when the email matches the order.
            Delivery dates are estimates supplied by the courier (Delhivery, India Post, EMS, or DTDC) and may change.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-sm text-[#9a7d72]">
          Loading…
        </div>
      }
    >
      <TrackOrderPageInner />
    </Suspense>
  )
}
