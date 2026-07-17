'use client'

import { ArrowRight, StarIcon, X, ChevronLeft, ChevronRight, Ruler, Shirt, Sparkles, MessageCircle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, useRef, useMemo } from 'react'
import axios from 'axios'
import ReviewForm from './ReviewForm'
import { useSelector } from 'react-redux'

function getProductImage(product) {
  const first = product?.images?.[0]
  if (typeof first === 'string' && first.trim()) return first
  if (first?.url) return first.url
  return 'https://placehold.co/600x750?text=Nilaas'
}

function formatPrice(value) {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return null
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

const STYLE_GUIDES = {
  fabric: {
    title: 'Fabric guide',
    body: (
      <>
        <p className="mb-3">
          Choose fabric based on climate, occasion and how you like clothes to move on the body.
        </p>
        <p className="mb-3">
          <strong>Cotton</strong> — Breathable and easy for everyday kurtis, shirts and summer sets.
        </p>
        <p className="mb-3">
          <strong>Cotton blends</strong> — Soft with a little stretch; great for office and travel.
        </p>
        <p className="mb-3">
          <strong>Georgette / chiffon</strong> — Light drape for festive looks and layered styling.
        </p>
        <p>
          <strong>Linen &amp; viscose</strong> — Airy for warm weather; expect a natural, relaxed fall.
        </p>
      </>
    ),
  },
  fit: {
    title: 'Fit & size guide',
    body: (
      <>
        <p className="mb-3">
          Nilaas sizes follow common Indian ethnic / western charts. Measure bust, waist and hip at the fullest points.
        </p>
        <p className="mb-3">
          If you are between sizes, size up for a relaxed drape or size down for a closer fit.
        </p>
        <p>
          Check the size chart on each product for length and sleeve notes — silhouettes vary by style.
        </p>
      </>
    ),
  },
  occasion: {
    title: 'Occasion styling',
    body: (
      <>
        <p className="mb-3">
          <strong>Everyday</strong> — Pair kurtis with leggings or jeans and simple juttis or flats.
        </p>
        <p className="mb-3">
          <strong>Work</strong> — Choose structured necks and solids; add a shrug or blazer.
        </p>
        <p>
          <strong>Festive</strong> — Prints, embroidery and co-ords shine with statement earrings and heels.
        </p>
      </>
    ),
  },
}

function ProductRail({ title, eyebrow, products, viewAllHref, loading }) {
  const railRef = useRef(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(true)

  const update = () => {
    const el = railRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 8)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8)
  }

  useEffect(() => {
    const el = railRef.current
    if (!el) return
    update()
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [products.length, loading])

  const scroll = (dir) => {
    const el = railRef.current
    if (!el) return
    const card = el.querySelector('[data-rail-card]')
    const amount = card ? card.clientWidth + 16 : 280
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  if (!loading && !products?.length) return null

  return (
    <section className="my-10 border border-[#2a1210]/10 p-5 sm:p-7 bg-white">
      <div className="flex items-end justify-between gap-4 mb-5">
        <div>
          {eyebrow && (
            <p className="text-[11px] tracking-[0.28em] uppercase text-[#8a5a4a] mb-1.5">{eyebrow}</p>
          )}
          <h2 className="font-serif text-2xl sm:text-3xl text-[#2a1210]">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="hidden sm:inline-flex items-center gap-1 text-sm text-[#6b2f28] hover:underline mr-2"
            >
              View all <ArrowRight size={14} />
            </Link>
          )}
          <button
            type="button"
            onClick={() => scroll('left')}
            disabled={!canLeft}
            className="h-10 w-10 border border-[#2a1210]/15 text-[#2a1210] flex items-center justify-center disabled:opacity-30 hover:bg-[#2a1210] hover:text-white transition"
            aria-label="Previous"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            disabled={!canRight}
            className="h-10 w-10 border border-[#2a1210]/15 text-[#2a1210] flex items-center justify-center disabled:opacity-30 hover:bg-[#2a1210] hover:text-white transition"
            aria-label="Next"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div
        ref={railRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                data-rail-card
                className="snap-start shrink-0 w-[46%] sm:w-[32%] md:w-[23%] lg:w-[20%]"
              >
                <div className="w-full bg-slate-100 animate-pulse" style={{ aspectRatio: '4 / 5' }} />
                <div className="mt-3 h-4 w-4/5 bg-slate-100 animate-pulse" />
                <div className="mt-2 h-4 w-1/3 bg-slate-100 animate-pulse" />
              </div>
            ))
          : products.map((p) => {
              const href = `/product/${p.slug || p._id || p.id}`
              const price = formatPrice(p.price > 0 ? p.price : p.AED)
              const mrp =
                Number(p.AED) > Number(p.price) && Number(p.price) > 0
                  ? formatPrice(p.AED)
                  : null
              return (
                <Link
                  key={p._id || p.id || p.slug}
                  href={href}
                  data-rail-card
                  className="group snap-start shrink-0 w-[46%] sm:w-[32%] md:w-[23%] lg:w-[20%]"
                >
                  <div
                    className="relative w-full overflow-hidden bg-slate-50 border border-slate-100"
                    style={{ aspectRatio: '4 / 5' }}
                  >
                    <Image
                      src={getProductImage(p)}
                      alt={p.name || 'Product'}
                      fill
                      className="object-cover object-center transition duration-500 group-hover:scale-[1.03]"
                      sizes="(max-width: 640px) 46vw, 20vw"
                    />
                  </div>
                  <p className="mt-3 text-sm text-[#2a1210] line-clamp-2 leading-snug group-hover:text-[#6b2f28]">
                    {p.name || 'Product'}
                  </p>
                  {(price || mrp) && (
                    <div className="mt-1.5 flex items-baseline gap-2">
                      {price && (
                        <span className="text-sm font-semibold text-[#2a1210] tabular-nums">{price}</span>
                      )}
                      {mrp && (
                        <span className="text-xs text-[#9a7d72] line-through tabular-nums">{mrp}</span>
                      )}
                    </div>
                  )}
                </Link>
              )
            })}
      </div>
    </section>
  )
}

const ProductDescription = ({
  product,
  reviews = [],
  loadingReviews = false,
  onReviewAdded,
  relatedProducts = [],
}) => {
  const allProducts = useSelector((state) => state.product.list || [])
  const [fetchedRecommended, setFetchedRecommended] = useState([])
  const [recommendLoading, setRecommendLoading] = useState(true)
  const [showGuidesModal, setShowGuidesModal] = useState(false)
  const [selectedGuide, setSelectedGuide] = useState(null)
  const [showReviewModal, setShowReviewModal] = useState(false)

  const ratingCounts = [0, 0, 0, 0, 0]
  reviews.forEach((review) => {
    if (review.rating >= 1 && review.rating <= 5) ratingCounts[review.rating - 1]++
  })

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0

  const relatedKey = (relatedProducts || []).map((p) => p._id || p.id || p.slug).join('|')
  const reduxKey = (allProducts || []).slice(0, 24).map((p) => p._id || p.id).join('|')

  // Load recommended: same category first, then any other products (exclude current)
  useEffect(() => {
    let active = true
    const currentId = String(product?._id || '')

    const dedupe = (list) => {
      const seen = new Set()
      const out = []
      for (const p of list || []) {
        const id = String(p._id || p.id || p.slug || '')
        if (!id || id === currentId || seen.has(id)) continue
        if (p.slug && product?.slug && p.slug === product.slug) continue
        seen.add(id)
        out.push(p)
      }
      return out
    }

    const fromRedux = () => {
      const productCats = [
        product.category,
        ...(Array.isArray(product.categories) ? product.categories : []),
      ].filter(Boolean)
      const sameCat = allProducts.filter((p) => {
        if (!p || String(p._id) === currentId || !productCats.length) return false
        const pCats = [p.category, ...(Array.isArray(p.categories) ? p.categories : [])].filter(Boolean)
        return pCats.some((c) => productCats.includes(c))
      })
      const others = allProducts.filter((p) => {
        if (!p || String(p._id) === currentId) return false
        const pCats = [p.category, ...(Array.isArray(p.categories) ? p.categories : [])].filter(Boolean)
        return !productCats.length || !pCats.some((c) => productCats.includes(c))
      })
      return dedupe([...sameCat, ...others]).slice(0, 12)
    }

    const load = async () => {
      setRecommendLoading(true)
      let list = dedupe(relatedProducts)

      if (list.length < 4) {
        list = dedupe([...list, ...fromRedux()])
      }

      if (list.length < 4) {
        try {
          const qs = product.category
            ? `limit=16&category=${encodeURIComponent(product.category)}`
            : 'limit=16'
          const { data } = await axios.get(`/api/products?${qs}`)
          list = dedupe([...list, ...(data?.products || [])])
        } catch {
          // ignore
        }
      }

      if (list.length < 4) {
        try {
          const { data } = await axios.get('/api/products?limit=16')
          list = dedupe([...list, ...(data?.products || [])])
        } catch {
          // ignore
        }
      }

      if (active) {
        setFetchedRecommended(list.slice(0, 12))
        setRecommendLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?._id, product?.slug, product?.category, relatedKey, reduxKey])

  const railProducts = useMemo(() => fetchedRecommended, [fetchedRecommended])

  return (
    <div className="my-10 bg-white">
      {/* Style guides modal */}
      {showGuidesModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setShowGuidesModal(false)}
        >
          <div
            className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {!selectedGuide ? (
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="font-serif text-2xl text-[#2a1210]">Style guides</h2>
                  <button type="button" onClick={() => setShowGuidesModal(false)} className="text-slate-400 hover:text-slate-700">
                    <X size={22} />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { key: 'fabric', label: 'Fabric', icon: Sparkles },
                    { key: 'fit', label: 'Fit & size', icon: Ruler },
                    { key: 'occasion', label: 'Occasion', icon: Shirt },
                  ].map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedGuide(key)}
                      className="border border-[#2a1210]/12 p-6 text-center hover:border-[#2a1210] transition"
                    >
                      <Icon size={28} className="mx-auto mb-3 text-[#8a5a4a]" />
                      <span className="font-medium text-[#2a1210]">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <button type="button" onClick={() => setSelectedGuide(null)} className="text-[#6e5048] text-sm hover:underline">
                    ← Back
                  </button>
                  <h2 className="font-serif text-2xl text-[#2a1210] flex-1">{STYLE_GUIDES[selectedGuide]?.title}</h2>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGuide(null)
                      setShowGuidesModal(false)
                    }}
                  >
                    <X size={22} className="text-slate-400" />
                  </button>
                </div>
                <div className="text-[15px] text-[#4a3832] leading-relaxed">{STYLE_GUIDES[selectedGuide]?.body}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Customer reviews */}
      <div id="reviews" className="border border-[#2a1210]/10 scroll-mt-24 mb-8">
        <div className="text-center pt-10 pb-6 px-6 border-b border-[#2a1210]/08">
          <h2 className="font-serif text-2xl md:text-3xl text-[#2a1210] mb-2">Customer reviews</h2>
          <p className="text-sm text-[#6e5048]">What shoppers say about this piece</p>
        </div>

        <div className="px-6 md:px-10 py-10">
          {reviews.length === 0 ? (
            <div className="max-w-md mx-auto text-center">
              <div className="border border-[#2a1210]/10 bg-white p-10">
                <h3 className="font-serif text-xl text-[#2a1210] mb-4">Be the first to review</h3>
                <div className="flex items-center justify-center gap-1 mb-6">
                  {Array(5)
                    .fill('')
                    .map((_, i) => (
                      <StarIcon key={i} size={22} className="text-[#c4a035]" fill="currentColor" />
                    ))}
                </div>
                <button
                  type="button"
                  onClick={() => setShowReviewModal(true)}
                  className="inline-flex items-center gap-2 bg-[#2a1210] text-white text-sm font-semibold px-6 py-3 hover:bg-[#4a221c] transition"
                >
                  Write a review
                  <ArrowRight size={16} />
                </button>
              </div>
              <div id="review-form" className="mt-8 text-left border border-[#2a1210]/10 p-6">
                <ReviewForm productId={product._id} onReviewAdded={onReviewAdded} />
              </div>
            </div>
          ) : (
            <div>
              <div className="max-w-2xl mx-auto mb-10 border border-[#2a1210]/10 p-6 sm:p-8">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="text-center md:border-r md:border-[#2a1210]/10 md:pr-8">
                    <div className="text-4xl font-semibold text-[#2a1210] mb-2">{averageRating}</div>
                    <div className="flex justify-center mb-2">
                      {Array(5)
                        .fill('')
                        .map((_, i) => (
                          <StarIcon
                            key={i}
                            size={20}
                            fill={i < Math.round(averageRating) ? '#c4a035' : '#E5E7EB'}
                            className="text-transparent"
                          />
                        ))}
                    </div>
                    <div className="text-sm text-[#6e5048]">
                      Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="flex-1 w-full space-y-2">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = ratingCounts[star - 1]
                      const percentage = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0
                      return (
                        <div key={star} className="flex items-center gap-3">
                          <span className="text-sm text-[#4a3832] w-8">{star}★</span>
                          <div className="flex-1 bg-[#ebe0da] h-2 overflow-hidden">
                            <div style={{ width: `${percentage}%` }} className="h-full bg-[#2a1210]" />
                          </div>
                          <span className="text-sm text-[#6e5048] w-10 text-right">{percentage}%</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="text-center mb-10">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(true)}
                  className="inline-flex items-center gap-2 border border-[#2a1210] text-[#2a1210] text-sm font-semibold px-6 py-3 hover:bg-[#2a1210] hover:text-white transition"
                >
                  Write a review
                  <ArrowRight size={16} />
                </button>
              </div>

              {loadingReviews ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-[#2a1210]" />
                </div>
              ) : (
                <div className="max-w-3xl mx-auto space-y-4 mb-10">
                  {reviews.map((item, idx) => (
                    <div
                      key={item.id || item._id || idx}
                      className="border border-[#2a1210]/10 p-5 sm:p-6"
                    >
                      <div className="flex gap-4">
                        <div className="w-11 h-11 shrink-0 bg-[#2a1210] text-white flex items-center justify-center font-semibold">
                          {(item.userId?.name?.[0] || 'U').toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[#2a1210]">
                            {item.userId?.name || 'Anonymous'}
                          </p>
                          <div className="flex items-center gap-0.5 mt-1 mb-2">
                            {Array(5)
                              .fill('')
                              .map((_, index) => (
                                <StarIcon
                                  key={index}
                                  size={14}
                                  className="text-transparent"
                                  fill={item.rating >= index + 1 ? '#c4a035' : '#E5E7EB'}
                                />
                              ))}
                          </div>
                          <p className="text-[#4a3832] text-sm leading-relaxed">{item.review}</p>
                          {item.images?.length > 0 && (
                            <div className="flex gap-2 flex-wrap mt-3">
                              {item.images.map((img, i) => (
                                <Image
                                  key={i}
                                  src={img}
                                  alt=""
                                  width={80}
                                  height={80}
                                  className="object-cover border border-[#2a1210]/10"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div id="review-form" className="max-w-2xl mx-auto border border-[#2a1210]/10 p-6 sm:p-8">
                <h3 className="font-serif text-xl text-[#2a1210] mb-1">Write your review</h3>
                <p className="text-sm text-[#6e5048] mb-5">Share how this piece fits and feels</p>
                <ReviewForm productId={product._id} onReviewAdded={onReviewAdded} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Help / Talk to Nilaas */}
      <div className="border border-[#2a1210]/10 bg-white mb-5 px-6 md:px-10 py-10 md:py-12">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[11px] tracking-[0.28em] uppercase text-[#8a5a4a] mb-3">Nilaas styling</p>
          <h2 className="font-serif text-2xl md:text-3xl text-[#2a1210] mb-3 leading-tight">
            Need help picking a size or look?
          </h2>
          <p className="text-sm md:text-[15px] text-[#6e5048] mb-7 max-w-xl mx-auto leading-relaxed">
            Our team can help with fit, fabric and how to style this piece for work, everyday or festive wear.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-5 mb-8 text-sm text-[#4a3832]">
            <span className="inline-flex items-center gap-2">
              <Shirt size={16} className="text-[#8a5a4a]" /> Style advice
            </span>
            <span className="inline-flex items-center gap-2">
              <Ruler size={16} className="text-[#8a5a4a]" /> Size help
            </span>
            <span className="inline-flex items-center gap-2">
              <MessageCircle size={16} className="text-[#8a5a4a]" /> Quick replies
            </span>
          </div>
          <Link
            href="/contact-us"
            className="inline-flex items-center gap-2 bg-[#2a1210] text-white text-sm font-semibold px-7 py-3.5 hover:bg-[#4a221c] transition"
          >
            Talk to Nilaas
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Style guides banner */}
      <div className="relative mb-8 overflow-hidden bg-[#2a1210] px-6 md:px-10 py-8 md:py-9">
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <div className="flex-1">
            <h3 className="text-xl md:text-2xl font-serif text-white mb-1">Not sure what to wear?</h3>
            <p className="text-white/70 text-sm">Fabric, fit and occasion tips for shopping with confidence.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedGuide(null)
              setShowGuidesModal(true)
            }}
            className="inline-flex items-center justify-center gap-2 bg-white text-[#2a1210] text-sm font-semibold px-6 py-3 hover:bg-[#f5efe9] transition whitespace-nowrap"
          >
            View style guides
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Recommended — last */}
      <ProductRail
        eyebrow="Based on this piece"
        title="Recommended for you"
        products={railProducts}
        loading={recommendLoading}
        viewAllHref={product.category ? `/shop?category=${encodeURIComponent(product.category)}` : '/shop'}
      />

      {showReviewModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setShowReviewModal(false)}
        >
          <div
            className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-[#2a1210]/10 px-6 py-4 flex items-center justify-between">
              <h2 className="font-serif text-xl text-[#2a1210]">Write your review</h2>
              <button type="button" onClick={() => setShowReviewModal(false)}>
                <X size={22} className="text-slate-400" />
              </button>
            </div>
            <div className="p-6">
              <ReviewForm
                productId={product._id}
                autoShowForm={true}
                onReviewAdded={(newReview) => {
                  setShowReviewModal(false)
                  if (onReviewAdded) onReviewAdded(newReview)
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductDescription
