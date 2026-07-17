'use client'

import { useDispatch, useSelector } from 'react-redux'
import { useState, useEffect } from 'react'
import Counter from '@/components/Counter'
import CartSummaryBox from '@/components/CartSummaryBox'
import ProductCard from '@/components/ProductCard'
import { deleteItemFromCart } from '@/lib/features/cart/cartSlice'
import { PackageIcon, Trash2Icon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { fetchShippingSettings, calculateShipping } from '@/lib/shipping'

export const dynamic = 'force-dynamic'

function getProductImage(item) {
  const first = item?.images?.[0]
  if (typeof first === 'string' && first.trim()) return first
  if (first?.url) return first.url
  return 'https://placehold.co/400x500?text=Nilaas'
}

export default function Cart() {
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹'
  const getToken = async () => null
  const isSignedIn = false

  const { cartItems, hydrated: cartHydrated } = useSelector((state) => state.cart)
  const products = useSelector((state) => state.product.list)

  const dispatch = useDispatch()

  const [cartArray, setCartArray] = useState([])
  const [totalPrice, setTotalPrice] = useState(0)
  const [recentOrders, setRecentOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [shippingSetting, setShippingSetting] = useState(null)
  const [shippingFee, setShippingFee] = useState(0)

  const createCartArray = () => {
    let price = 0
    const next = []

    for (const [key, value] of Object.entries(cartItems || {})) {
      const product = products.find((p) => String(p._id) === String(key))
      if (product) {
        next.push({ ...product, quantity: value })
        price += product.price * value
      }
      // Do not delete missing keys — product list may still be loading / incomplete
    }

    setTotalPrice(price)
    setCartArray(next)
  }

  const handleDeleteItemFromCart = (productId) => {
    dispatch(deleteItemFromCart({ productId }))
  }

  const fetchRecentOrders = async () => {
    if (!isSignedIn) {
      setLoadingOrders(false)
      return
    }
    try {
      const token = await getToken()
      const axios = (await import('axios')).default
      const { data } = await axios.get('/api/orders', {
        headers: { Authorization: `Bearer ${token}` },
      })

      const recentProducts = []
      const seenProductIds = new Set()

      if (data.orders?.length > 0) {
        for (const order of data.orders) {
          for (const item of order.orderItems || []) {
            if (!item.product?._id) continue
            if (!seenProductIds.has(item.product._id) && recentProducts.length < 8) {
              seenProductIds.add(item.product._id)
              recentProducts.push(item.product)
            }
          }
          if (recentProducts.length >= 8) break
        }
      }

      setRecentOrders(recentProducts)
    } catch (error) {
      console.error('Failed to fetch recent orders:', error)
    } finally {
      setLoadingOrders(false)
    }
  }

  useEffect(() => {
    if (products.length > 0) {
      createCartArray()
    }
  }, [cartItems, products])

  useEffect(() => {
    async function loadShipping() {
      const setting = await fetchShippingSettings()
      setShippingSetting(setting)
    }
    loadShipping()
  }, [])

  useEffect(() => {
    if (shippingSetting && cartArray.length > 0) {
      setShippingFee(calculateShipping({ cartItems: cartArray, shippingSetting }))
    } else {
      setShippingFee(0)
    }
  }, [shippingSetting, cartArray])

  useEffect(() => {
    fetchRecentOrders()
  }, [isSignedIn])

  const itemCount = cartArray.reduce((sum, item) => sum + (item.quantity || 0), 0)

  if (!cartHydrated || (Object.keys(cartItems || {}).length > 0 && products.length === 0)) {
    return (
      <div className="bg-white min-h-[50vh] flex items-center justify-center py-20">
        <p className="text-sm text-[#6e5048]">Loading your bag…</p>
      </div>
    )
  }

  return (
    <div className="bg-white min-h-[60vh]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {cartArray.length > 0 ? (
          <>
            <div className="mb-8 border-b border-[#2a1210]/08 pb-6">
              <p className="text-[11px] tracking-[0.28em] uppercase text-[#8a5a4a] mb-2">Nilaas</p>
              <h1 className="font-serif text-3xl sm:text-4xl text-[#2a1210]">
                Shopping bag
              </h1>
              <p className="mt-2 text-sm text-[#6e5048]">
                {itemCount} {itemCount === 1 ? 'item' : 'items'} ready for checkout
              </p>
            </div>

            <div className="flex gap-8 lg:gap-12 max-lg:flex-col">
              <div className="flex-1 space-y-0">
                {cartArray.map((item) => {
                  const href = `/product/${item.slug || item._id}`
                  const lineTotal = item.price * item.quantity
                  const mrp =
                    Number(item.AED) > Number(item.price) && Number(item.price) > 0
                      ? Number(item.AED)
                      : null

                  return (
                    <div
                      key={item._id}
                      className="border-b border-[#2a1210]/10 py-6 first:pt-0"
                    >
                      <div className="flex gap-4 sm:gap-6">
                        <Link
                          href={href}
                          className="relative w-[100px] sm:w-[120px] shrink-0 overflow-hidden bg-slate-50 border border-slate-100"
                          style={{ aspectRatio: '4 / 5' }}
                        >
                          <Image
                            src={getProductImage(item)}
                            alt={item.name || 'Product'}
                            fill
                            className="object-cover object-center"
                            sizes="120px"
                          />
                        </Link>

                        <div className="flex-1 min-w-0 flex flex-col">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              {item.category && (
                                <p className="text-[11px] tracking-[0.18em] uppercase text-[#9a7d72] mb-1">
                                  {item.category}
                                </p>
                              )}
                              <Link
                                href={href}
                                className="font-serif text-lg sm:text-xl text-[#2a1210] leading-snug hover:text-[#6b2f28] transition line-clamp-2"
                              >
                                {item.name}
                              </Link>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteItemFromCart(item._id)}
                              className="shrink-0 p-2 text-[#9a7d72] hover:text-[#2a1210] transition"
                              aria-label="Remove item"
                            >
                              <Trash2Icon size={18} />
                            </button>
                          </div>

                          <div className="mt-auto pt-4 flex flex-wrap items-end justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <Counter productId={item._id} />
                              <button
                                type="button"
                                onClick={() => handleDeleteItemFromCart(item._id)}
                                className="text-xs tracking-wide uppercase text-[#9a7d72] hover:text-[#2a1210] transition md:hidden"
                              >
                                Remove
                              </button>
                            </div>

                            <div className="text-right">
                              <p className="text-base sm:text-lg font-semibold text-[#2a1210] tabular-nums">
                                {currency}
                                {lineTotal.toLocaleString('en-IN')}
                              </p>
                              <div className="flex items-baseline justify-end gap-2 mt-0.5">
                                <span className="text-sm text-[#6e5048] tabular-nums">
                                  {currency}
                                  {Number(item.price).toLocaleString('en-IN')} each
                                </span>
                                {mrp && (
                                  <span className="text-xs text-[#9a7d72] line-through tabular-nums">
                                    {currency}
                                    {mrp.toLocaleString('en-IN')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="lg:w-[380px] shrink-0">
                <div className="lg:sticky lg:top-20">
                  <CartSummaryBox
                    subtotal={totalPrice}
                    shipping={shippingFee}
                    total={totalPrice + shippingFee}
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="min-h-[55vh] flex items-center justify-center py-16">
            <div className="text-center max-w-md border border-[#2a1210]/10 bg-white px-8 py-12 sm:px-12">
              <p className="text-[11px] tracking-[0.28em] uppercase text-[#8a5a4a] mb-3">Nilaas</p>
              <div className="w-16 h-16 mx-auto mb-5 border border-[#2a1210]/15 flex items-center justify-center">
                <PackageIcon size={28} className="text-[#8a5a4a]" />
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl text-[#2a1210] mb-3">
                Your bag is empty
              </h1>
              <p className="text-sm text-[#6e5048] mb-8 leading-relaxed">
                Discover kurtis, co-ords and everyday pieces made for how you dress.
              </p>
              <Link
                href="/shop"
                className="inline-flex items-center justify-center gap-2 h-13 min-h-[52px] px-8 bg-[#2a1210] text-[#faf7f4] text-sm font-semibold tracking-wide hover:bg-[#4a221c] transition"
              >
                Continue shopping
              </Link>
            </div>
          </div>
        )}

        {isSignedIn && !loadingOrders && recentOrders.length > 0 && (
          <div className="mt-16 mb-8 border-t border-[#2a1210]/10 pt-12">
            <p className="text-[11px] tracking-[0.28em] uppercase text-[#8a5a4a] mb-2">
              Order again
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#2a1210] mb-2">
              Recently ordered
            </h2>
            <p className="text-sm text-[#6e5048] mb-8">Pieces from your recent orders</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {recentOrders.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
