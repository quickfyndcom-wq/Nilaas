'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/useAuth'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import { useDispatch } from 'react-redux'
import { addToCart } from '@/lib/features/cart/cartSlice'
import PageTitle from '@/components/PageTitle'
import Loading from '@/components/Loading'
import { SITE } from '@/lib/site'

const PLACEHOLDER_IMAGE = '/placeholder.png'

const getProduct = (item) => {
  if (!item) return null
  if (item.product) {
    return {
      ...item.product,
      _pid: item.productId || item.product.id,
    }
  }
  return {
    ...item,
    _pid: item.productId || item.id,
  }
}

export default function WishlistAuthed() {
  const { user, isSignedIn, loading: authLoading } = useAuth()
  const router = useRouter()
  const dispatch = useDispatch()
  const [wishlist, setWishlist] = useState([])
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(true)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (authLoading) return
    isSignedIn ? loadUserWishlist() : loadGuestWishlist()
  }, [authLoading, isSignedIn])

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const loadGuestWishlist = () => {
    try {
      const data = JSON.parse(localStorage.getItem('guestWishlist') || '[]')
      setWishlist(Array.isArray(data) ? data : [])
    } catch {
      setWishlist([])
    } finally {
      setLoading(false)
    }
  }

  const loadUserWishlist = async () => {
    try {
      const token = await user.getIdToken(true)
      const { data } = await axios.get('/api/wishlist', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setWishlist(Array.isArray(data?.wishlist) ? data.wishlist : [])
    } catch {
      setWishlist([])
    } finally {
      setLoading(false)
    }
  }

  const removeFromWishlist = async (pid) => {
    if (!isSignedIn) {
      const updated = wishlist.filter((i) => (i.productId || i.id) !== pid)
      localStorage.setItem('guestWishlist', JSON.stringify(updated))
      setWishlist(updated)
      setSelected((s) => s.filter((x) => x !== pid))
      return
    }
    const token = await user.getIdToken(true)
    await axios.post(
      '/api/wishlist',
      { productId: pid, action: 'remove' },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    setWishlist((w) => w.filter((i) => i.productId !== pid))
    setSelected((s) => s.filter((x) => x !== pid))
  }

  const toggleSelect = (pid) => {
    setSelected((s) => (s.includes(pid) ? s.filter((x) => x !== pid) : [...s, pid]))
  }

  const selectAll = () => {
    setSelected(
      selected.length === wishlist.length ? [] : wishlist.map((i) => i.productId || i.id)
    )
  }

  const addSelectedToCart = () => {
    selected.forEach((pid) => {
      const item = wishlist.find((i) => (i.productId || i.id) === pid)
      const product = getProduct(item)
      if (product) dispatch(addToCart({ product }))
    })
    router.push('/cart')
  }

  const total = selected.reduce((sum, pid) => {
    const item = wishlist.find((i) => (i.productId || i.id) === pid)
    const product = getProduct(item)
    return sum + Number(product?.price || 0)
  }, 0)

  if (authLoading || loading) return <Loading />

  return (
    <>
      <PageTitle title="My Wishlist" />
      <div className={`min-h-screen bg-[#faf6f2] text-[#2a1210] ${ready ? 'wl-ready' : ''}`}>
        <style jsx>{`
          @keyframes wlRise {
            from {
              opacity: 0;
              transform: translateY(18px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .wl-rise {
            opacity: 0;
          }
          .wl-ready .wl-rise {
            animation: wlRise 0.75s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          }
          .wl-ready .wl-rise-1 {
            animation-delay: 0.06s;
          }
          .wl-ready .wl-rise-2 {
            animation-delay: 0.16s;
          }
          .wl-ready .wl-rise-3 {
            animation-delay: 0.28s;
          }
        `}</style>

        {/* Compact brand header — same language as find-store */}
        <header className="relative overflow-hidden bg-[#1a0f0d] text-[#f5ebe4]">
          <div className="absolute inset-0">
            <img
              src="/find-store-fashion-hero.png"
              alt=""
              className="h-full w-full object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1a0f0d] via-[#1a0f0d]/85 to-[#1a0f0d]/55" />
          </div>
          <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
            <p className="wl-rise wl-rise-1 font-serif text-4xl sm:text-5xl tracking-tight text-white mb-3">
              {SITE.name}
            </p>
            <h1 className="wl-rise wl-rise-2 text-xl sm:text-2xl font-medium text-[#f0ddd3] mb-2">
              Your wishlist
            </h1>
            <p className="wl-rise wl-rise-3 text-sm text-[#c9a99a] max-w-md">
              {wishlist.length === 0
                ? 'Saved dresses and co-ords will appear here.'
                : `${wishlist.length} saved piece${wishlist.length === 1 ? '' : 's'} ready when you are.`}
            </p>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-10 lg:gap-14">
            <main>
              {wishlist.length > 0 && (
                <div className="flex items-center justify-between gap-4 mb-8 pb-4 border-b border-[#2a1210]/10">
                  <label className="flex items-center gap-3 cursor-pointer select-none text-sm">
                    <input
                      type="checkbox"
                      checked={selected.length === wishlist.length && wishlist.length > 0}
                      onChange={selectAll}
                      className="accent-[#6b2f28] w-4 h-4"
                      id="selectAllWishlist"
                    />
                    <span className="font-medium text-[#2a1210]">
                      Select all ({wishlist.length})
                    </span>
                  </label>
                  <span className="text-xs uppercase tracking-wider text-[#9a7d72]">
                    {selected.length} selected
                  </span>
                </div>
              )}

              {wishlist.length === 0 ? (
                <div className="py-20 sm:py-28 text-center border border-dashed border-[#2a1210]/15 bg-white/50">
                  <Heart className="mx-auto mb-5 text-[#c9a99a]" size={40} strokeWidth={1.25} />
                  <h2 className="font-serif text-2xl sm:text-3xl text-[#2a1210] mb-3">
                    Nothing saved yet
                  </h2>
                  <p className="text-sm text-[#6e5048] max-w-sm mx-auto mb-8 leading-relaxed">
                    Browse dresses, co-ords, and festive sets — tap the heart to save pieces you love.
                  </p>
                  <Link
                    href="/shop"
                    className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#2a1210] text-[#f5ebe4] text-sm font-semibold tracking-wide uppercase hover:bg-[#4a221c] transition-colors"
                  >
                    Browse the collection
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <ul className="space-y-0 divide-y divide-[#2a1210]/08">
                  {wishlist.map((item) => {
                    const product = getProduct(item)
                    if (!product) return null
                    const img = product.images?.[0] || PLACEHOLDER_IMAGE
                    const isSelected = selected.includes(product._pid)
                    const discount =
                      product.AED && product.AED > product.price
                        ? Math.round(((product.AED - product.price) / product.AED) * 100)
                        : 0

                    return (
                      <li
                        key={product._pid}
                        className={`flex gap-4 sm:gap-5 py-5 sm:py-6 transition-colors ${
                          isSelected ? 'bg-[#f3ebe4]/60 -mx-3 px-3 sm:-mx-4 sm:px-4' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(product._pid)}
                          className="accent-[#6b2f28] w-4 h-4 mt-8 sm:mt-10 shrink-0"
                          aria-label={`Select ${product.name}`}
                        />

                        <Link
                          href={`/product/${product.slug || product._pid}`}
                          className="relative w-24 h-28 sm:w-28 sm:h-36 shrink-0 overflow-hidden bg-[#f0e8e0]"
                        >
                          <Image
                            src={img}
                            alt={product.name}
                            fill
                            className="object-cover"
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.onerror = null
                              e.currentTarget.src = PLACEHOLDER_IMAGE
                            }}
                          />
                          {discount > 0 && (
                            <span className="absolute top-2 left-2 bg-[#2a1210] text-[#f5ebe4] text-[10px] font-semibold px-1.5 py-0.5 tracking-wide">
                              −{discount}%
                            </span>
                          )}
                        </Link>

                        <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="min-w-0">
                            <Link
                              href={`/product/${product.slug || product._pid}`}
                              className="font-medium text-[#2a1210] hover:text-[#6b2f28] transition-colors line-clamp-2"
                            >
                              {product.name}
                            </Link>
                            <div className="mt-2 flex items-baseline gap-2">
                              <span className="text-lg font-semibold tracking-tight text-[#2a1210]">
                                ₹{Number(product.price || 0).toLocaleString('en-IN')}
                              </span>
                              {product.AED && product.AED > product.price ? (
                                <span className="text-xs text-[#9a7d72] line-through">
                                  ₹{Number(product.AED).toLocaleString('en-IN')}
                                </span>
                              ) : null}
                            </div>
                          </div>

                          <div className="flex sm:flex-col gap-2 sm:items-stretch shrink-0">
                            <button
                              type="button"
                              onClick={() => dispatch(addToCart({ product }))}
                              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#2a1210] text-[#f5ebe4] text-xs font-semibold uppercase tracking-wide hover:bg-[#4a221c] transition-colors"
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                              Add to bag
                            </button>
                            <button
                              type="button"
                              onClick={() => removeFromWishlist(product._pid)}
                              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium text-[#6b2f28] hover:text-[#2a1210] transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Remove
                            </button>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </main>

            {/* Summary — interaction panel */}
            <aside className="lg:sticky lg:top-24 h-fit border border-[#2a1210]/10 bg-white p-6 sm:p-7">
              <h3 className="font-serif text-2xl text-[#2a1210] mb-6">Summary</h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between text-[#6e5048]">
                  <span>Selected</span>
                  <span className="font-semibold text-[#2a1210]">{selected.length}</span>
                </div>
                <div className="flex justify-between items-baseline pt-4 border-t border-[#2a1210]/10">
                  <span className="text-[#6e5048]">Total</span>
                  <span className="font-serif text-2xl text-[#2a1210]">
                    ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
              <button
                type="button"
                disabled={selected.length === 0}
                onClick={addSelectedToCart}
                className={`w-full mt-6 py-3.5 text-sm font-semibold uppercase tracking-wide transition-colors ${
                  selected.length === 0
                    ? 'bg-[#e8ddd4] text-[#9a7d72] cursor-not-allowed'
                    : 'bg-[#2a1210] text-[#f5ebe4] hover:bg-[#4a221c]'
                }`}
              >
                {selected.length === 0 ? 'Select pieces to checkout' : `Checkout (${selected.length})`}
              </button>
              <Link
                href="/shop"
                className="mt-4 block text-center text-xs font-semibold uppercase tracking-wide text-[#6b2f28] hover:text-[#2a1210] transition-colors"
              >
                Continue shopping
              </Link>
            </aside>
          </div>
        </div>

        {/* Mobile checkout bar */}
        {selected.length > 0 && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[#2a1210]/10 bg-[#faf6f2]/95 backdrop-blur-sm px-5 py-4">
            <div className="flex justify-between items-center gap-4 max-w-6xl mx-auto">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-[#9a7d72]">
                  {selected.length} selected
                </p>
                <p className="font-serif text-xl text-[#2a1210]">
                  ₹{total.toLocaleString('en-IN')}
                </p>
              </div>
              <button
                type="button"
                onClick={addSelectedToCart}
                className="px-6 py-3 bg-[#2a1210] text-[#f5ebe4] text-sm font-semibold uppercase tracking-wide"
              >
                Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
