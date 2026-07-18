'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { fetchProducts } from '@/lib/features/product/productSlice'
import axios from 'axios'

const getImageSrc = (product) => {
  if (Array.isArray(product?.images) && product.images.length > 0) {
    const first = product.images[0]
    if (typeof first === 'string' && first) return first
    if (first?.url) return first.url
    if (first?.src) return first.src
  }
  return 'https://placehold.co/600x600?text=No+Image'
}

const getHoverImageSrc = (product) => {
  if (Array.isArray(product?.images) && product.images.length > 1) {
    const second = product.images[1]
    if (typeof second === 'string' && second) return second
    if (second?.url) return second.url
    if (second?.src) return second.src
  }
  return null
}

const formatPrice = (value) => {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return null
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

const normalize = (value) => String(value || '').trim().toLowerCase()

export default function AuspiciousProductsCarousel() {
  const dispatch = useDispatch()
  const list = useSelector((state) => state.product.list || [])
  const railRef = useRef(null)
  const [heading, setHeading] = useState({
    title: 'This week’s favourites',
    subtitle: 'Most-loved dresses & kurtis from the Nilaas edit',
    image: '',
    visible: true
  })
  const [selectedCategoryNames, setSelectedCategoryNames] = useState([])
  const [productsLoading, setProductsLoading] = useState(list.length === 0)
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  useEffect(() => {
    let active = true

    const loadProducts = async () => {
      if (list.length === 0) {
        setProductsLoading(true)
        try {
          await dispatch(fetchProducts({ limit: 48 })).unwrap()
        } catch {
          // Keep section resilient; show no cards if fetch fails.
        } finally {
          if (active) setProductsLoading(false)
        }
      } else {
        setProductsLoading(false)
      }
    }

    loadProducts()
    return () => {
      active = false
    }
  }, [dispatch, list.length])

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data } = await axios.get('/api/store/settings')
        const settings = data?.settings || {}

        if (settings?.section8Heading) {
          setHeading((prev) => ({
            ...prev,
            ...settings.section8Heading
          }))
        }

        const display = settings?.section8Display || {}
        const names = Array.isArray(display?.selectedCategoryNames)
          ? display.selectedCategoryNames.filter(Boolean)
          : []
        setSelectedCategoryNames(names)
      } catch (error) {
        console.error('Failed to load section 8 settings:', error)
      } finally {
        setSettingsLoading(false)
      }
    }

    loadSettings()
  }, [])

  const products = useMemo(() => {
    const base = list.filter((p) => p && (p._id || p.id) && (p.slug || p._id || p.id))

    if (selectedCategoryNames.length === 0) {
      return base.slice(0, 12)
    }

    const orderedNames = selectedCategoryNames.map(normalize).filter(Boolean)
    const buckets = orderedNames.map((cat) =>
      base.filter((p) => normalize(p?.category) === cat)
    )

    const mixed = []
    let progressed = true
    while (mixed.length < 12 && progressed) {
      progressed = false
      for (const bucket of buckets) {
        if (bucket.length > 0) {
          mixed.push(bucket.shift())
          progressed = true
          if (mixed.length >= 12) break
        }
      }
    }

    return mixed.length > 0 ? mixed : base.slice(0, 12)
  }, [list, selectedCategoryNames])

  const updateScrollState = () => {
    const el = railRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 8)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8)
  }

  useEffect(() => {
    const el = railRef.current
    if (!el) return
    updateScrollState()
    el.addEventListener('scroll', updateScrollState, { passive: true })
    window.addEventListener('resize', updateScrollState)
    return () => {
      el.removeEventListener('scroll', updateScrollState)
      window.removeEventListener('resize', updateScrollState)
    }
  }, [products.length, productsLoading, settingsLoading])

  const isLoading = productsLoading || settingsLoading

  if (heading.visible === false) return null
  if (!isLoading && products.length === 0) return null

  const scrollByCards = (direction) => {
    if (!railRef.current) return
    const card = railRef.current.querySelector('[data-card]')
    if (!card) return
    const gap = 18
    const amount = card.clientWidth + gap
    railRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth'
    })
  }

  return (
    <section
      className="relative w-full overflow-hidden py-14 sm:py-16 lg:py-20"
      style={{
        background: '#faf6f2'
      }}
    >
      {/* Soft grain / fabric texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")'
        }}
      />

      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(240px,320px)_1fr] gap-8 lg:gap-10 items-end lg:items-stretch">
          {/* Editorial intro */}
          <div className="flex flex-col justify-between gap-8 lg:py-2 lg:pr-2">
            <div>
              <p className="text-[11px] sm:text-xs tracking-[0.28em] uppercase text-[#8a5a4a] mb-3 animate-[fadeIn_0.6s_ease-out]">
                Nilaas edit
              </p>

              {isLoading ? (
                <>
                  <div className="h-12 sm:h-16 w-full max-w-[280px] rounded bg-[#e8ddd6] animate-pulse" />
                  <div className="h-4 mt-4 w-full max-w-[260px] rounded bg-[#e8ddd6] animate-pulse" />
                  <div className="h-4 mt-2 w-4/5 max-w-[220px] rounded bg-[#e8ddd6] animate-pulse" />
                </>
              ) : (
                <>
                  <h2 className="font-serif text-[2.15rem] sm:text-[2.75rem] lg:text-[3.1rem] leading-[1.08] text-[#2a1210] tracking-tight animate-[fadeIn_0.7s_ease-out]">
                    {heading.title || 'For an Auspicious Beginning'}
                  </h2>
                  <p className="mt-4 text-[15px] sm:text-base leading-relaxed text-[#6e5048] max-w-[28ch] animate-[fadeIn_0.9s_ease-out]">
                    {heading.subtitle ||
                      'Discover our most-loved designs, curated for this Akshaya Tritiya'}
                  </p>
                </>
              )}

              {!isLoading && heading.image && (
                <div className="mt-5 relative h-28 w-full max-w-[240px] overflow-hidden">
                  <Image
                    src={heading.image}
                    alt={heading.title || 'Collection'}
                    fill
                    className="object-cover"
                    sizes="240px"
                  />
                </div>
              )}
            </div>

            {!isLoading && (
              <div className="flex items-center justify-between gap-4 lg:flex-col lg:items-start lg:gap-6">
                <Link
                  href="/shop"
                  className="group inline-flex items-center gap-2 text-sm font-medium text-[#2a1210] border-b border-[#2a1210]/40 pb-0.5 transition hover:border-[#2a1210]"
                >
                  Shop the edit
                  <ArrowRight
                    size={16}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </Link>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => scrollByCards('left')}
                    disabled={!canScrollLeft}
                    className="h-11 w-11 flex items-center justify-center border border-[#2a1210]/20 text-[#2a1210] transition enabled:hover:bg-[#2a1210] enabled:hover:text-[#faf6f3] disabled:opacity-30"
                    aria-label="Previous products"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollByCards('right')}
                    disabled={!canScrollRight}
                    className="h-11 w-11 flex items-center justify-center border border-[#2a1210]/20 text-[#2a1210] transition enabled:hover:bg-[#2a1210] enabled:hover:text-[#faf6f3] disabled:opacity-30"
                    aria-label="Next products"
                  >
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Product rail */}
          <div className="min-w-0 relative">
            <div
              ref={railRef}
              className="flex gap-[18px] overflow-x-auto snap-x snap-mandatory pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {isLoading
                ? Array.from({ length: 4 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="snap-start shrink-0 w-[68%] sm:w-[42%] md:w-[34%] lg:w-[30%] xl:w-[26%]"
                    >
                      <div className="aspect-[3/4] bg-[#e8ddd6] animate-pulse" />
                      <div className="mt-3 h-4 w-4/5 bg-[#e8ddd6] rounded animate-pulse" />
                      <div className="mt-2 h-4 w-1/3 bg-[#e8ddd6] rounded animate-pulse" />
                    </div>
                  ))
                : products.map((product, index) => {
                    const productName = product.name || product.title || 'Product'
                    const salePrice = Number(product.price)
                    const listPrice = Number(product.AED)
                    const priceText = formatPrice(salePrice > 0 ? salePrice : listPrice)
                    const mrpText =
                      salePrice > 0 && listPrice > salePrice ? formatPrice(listPrice) : null
                    const primary = getImageSrc(product)
                    const hover = getHoverImageSrc(product)

                    return (
                      <Link
                        key={product._id || product.id}
                        href={`/product/${product.slug || product._id || product.id}`}
                        data-card
                        className="group snap-start shrink-0 w-[68%] sm:w-[42%] md:w-[34%] lg:w-[30%] xl:w-[26%] animate-[fadeIn_0.55s_ease-out]"
                        style={{ animationDelay: `${Math.min(index, 6) * 60}ms` }}
                      >
                        <div className="relative aspect-[3/4] overflow-hidden bg-[#ebe0da]">
                          <Image
                            src={primary}
                            alt={productName}
                            fill
                            className={`object-cover transition duration-700 ease-out group-hover:scale-[1.04] ${
                              hover ? 'group-hover:opacity-0' : ''
                            }`}
                            sizes="(max-width: 640px) 68vw, (max-width: 1024px) 34vw, 26vw"
                          />
                          {hover && (
                            <Image
                              src={hover}
                              alt=""
                              fill
                              className="object-cover opacity-0 transition duration-700 ease-out group-hover:opacity-100 group-hover:scale-[1.04]"
                              sizes="(max-width: 640px) 68vw, (max-width: 1024px) 34vw, 26vw"
                            />
                          )}
                          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/25 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                        </div>

                        <div className="mt-3.5 pr-1">
                          <p className="text-[14px] sm:text-[15px] text-[#2a1210] leading-snug line-clamp-2 transition-colors duration-300 group-hover:text-[#6b2f28]">
                            {productName}
                          </p>
                          {(priceText || mrpText) && (
                            <div className="mt-1.5 flex items-baseline gap-2">
                              {priceText && (
                                <span className="text-[15px] sm:text-[16px] font-medium text-[#2a1210] tabular-nums">
                                  {priceText}
                                </span>
                              )}
                              {mrpText && (
                                <span className="text-[13px] text-[#9a7d72] line-through tabular-nums">
                                  {mrpText}
                                </span>
                              )}
                            </div>
                          )}
                          <span className="mt-2 block h-px w-0 bg-[#2a1210]/50 transition-all duration-500 group-hover:w-10" />
                        </div>
                      </Link>
                    )
                  })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
