'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

const CACHE_KEY = 'hero-banners:v7'
const CACHE_TTL_MS = 15 * 1000

const FALLBACK_SLIDES = [
  {
    image: '/find-store-fashion-hero.png',
    title: 'Cotton kurtis & co-ords',
    subtitle: 'New season edit',
    cta: 'Shop new arrivals',
    link: '/category/new-arrivals',
    description: '',
    showTitle: true,
    showSubtitle: true,
    showButton: true,
    showBadge: false,
  },
]

function mapBannersToSlides(banners) {
  const active = Array.isArray(banners) ? banners.filter((b) => b && b.isActive !== false) : []
  return active
    .filter((b) => b.image)
    .map((banner) => {
      const title = String(banner.title || '').trim()
      const subtitle = String(banner.subtitle || '').trim()
      const badge = String(banner.badge || '').trim()
      const cta = String(banner.cta || '').trim()
      const description = String(banner.description || '').trim()
      const link = String(banner.link || '').trim() || '/shop'

      // Filled fields only — empty fields stay hidden on the storefront
      return {
        image: banner.image || '',
        mobileImage: banner.mobileImage || banner.image || '',
        badge,
        subtitle,
        title,
        description,
        cta,
        link,
        showTitle: Boolean(title) && banner.showTitle !== false,
        showSubtitle: Boolean(subtitle) && banner.showSubtitle !== false,
        showBadge: Boolean(badge) && banner.showBadge !== false,
        showButton: Boolean(cta) && banner.showButton !== false,
      }
    })
}

export default function Hero({ initialSlides = [] }) {
  const [slides, setSlides] = useState(
    initialSlides?.length ? initialSlides : FALLBACK_SLIDES
  )
  const [loading, setLoading] = useState(!(initialSlides && initialSlides.length > 0))
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    let aborted = false
    try {
      const raw = sessionStorage.getItem(CACHE_KEY)
      if (raw) {
        const cached = JSON.parse(raw)
        if (
          cached &&
          Array.isArray(cached.slides) &&
          cached.slides.length > 0 &&
          Date.now() - cached.ts < CACHE_TTL_MS
        ) {
          setSlides(cached.slides)
          setLoading(false)
        }
      }
    } catch {}

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort('timeout'), 6000)
    ;(async () => {
      try {
        const res = await fetch('/api/store/hero-banners', {
          cache: 'no-store',
          signal: controller.signal,
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        const dbSlides = mapBannersToSlides(data?.banners || [])
        const next = dbSlides.length > 0 ? dbSlides : FALLBACK_SLIDES
        if (!aborted) {
          setSlides(next)
          setLoading(false)
          setIndex(0)
          try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), slides: next }))
          } catch {}
        }
      } catch (error) {
        const isAbort =
          aborted ||
          error?.name === 'AbortError' ||
          /aborted|AbortError/i.test(String(error?.message || error || ''))
        if (isAbort) return
        if (!aborted) {
          setSlides((prev) => (prev.length ? prev : FALLBACK_SLIDES))
          setLoading(false)
        }
      } finally {
        clearTimeout(timer)
      }
    })()

    return () => {
      aborted = true
      clearTimeout(timer)
      controller.abort('unmount')
    }
  }, [])

  const count = slides.length
  const go = useCallback(
    (dir) => {
      if (count < 2) return
      setPaused(true)
      setIndex((i) => (i + dir + count) % count)
      setTimeout(() => setPaused(false), 8000)
    },
    [count]
  )

  useEffect(() => {
    if (paused || count < 2) return
    const id = setInterval(() => setIndex((i) => (i + 1) % count), 5500)
    return () => clearInterval(id)
  }, [paused, count])

  if (loading) {
    return (
      <section className="relative w-full bg-[#1a0f0d]">
        <div className="h-[58vh] min-h-[320px] max-h-[640px] animate-pulse bg-[#2a1210]" />
      </section>
    )
  }

  const slide = slides[index] || slides[0]
  if (!slide) return null

  return (
    <section className="relative w-full bg-[#1a0f0d] overflow-hidden">
      <div className="relative h-[58vh] min-h-[340px] max-h-[680px] w-full">
        {slides.map((s, i) => (
          <div
            key={`${s.image}-${i}`}
            className={`absolute inset-0 transition-opacity duration-700 ease-out ${
              i === index ? 'opacity-100 z-[1]' : 'opacity-0 z-0 pointer-events-none'
            }`}
            aria-hidden={i !== index}
            style={{
              backgroundImage: `url(${s.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {(s.showTitle && s.title) ||
            (s.showSubtitle && s.subtitle) ||
            (s.showBadge && s.badge) ||
            s.description ||
            (s.showButton && s.cta) ? (
              <div className="absolute inset-0 bg-gradient-to-r from-[#1a0f0d]/70 via-[#1a0f0d]/35 to-transparent" />
            ) : null}
          </div>
        ))}

        {(() => {
          const hasCopy =
            (slide.showBadge && slide.badge) ||
            (slide.showSubtitle && slide.subtitle) ||
            (slide.showTitle && slide.title) ||
            slide.description ||
            (slide.showButton && slide.cta)

          if (!hasCopy) return null

          return (
            <div className="absolute inset-0 z-[2] flex items-center">
              <div className="w-full max-w-6xl mx-auto px-5 sm:px-8">
                {slide.showBadge && slide.badge ? (
                  <span className="inline-block mb-3 text-[11px] tracking-[0.18em] uppercase text-[#f5ebe4] border border-white/40 px-3 py-1">
                    {slide.badge}
                  </span>
                ) : null}
                {slide.showSubtitle && slide.subtitle ? (
                  <p className="text-sm sm:text-base text-[#f5ebe4]/90 mb-2 tracking-wide">
                    {slide.subtitle}
                  </p>
                ) : null}
                {slide.showTitle && slide.title ? (
                  <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-white leading-[1.08] max-w-xl mb-6 drop-shadow-sm">
                    {slide.title}
                  </h1>
                ) : null}
                {slide.description ? (
                  <p className="text-sm sm:text-base text-[#f5ebe4]/85 max-w-md mb-7 leading-relaxed">
                    {slide.description}
                  </p>
                ) : null}
                {slide.showButton && slide.cta ? (
                  <Link
                    href={slide.link || '/shop'}
                    className="inline-flex items-center justify-center bg-[#f5ebe4] text-[#1a0f0d] text-[12px] font-semibold uppercase tracking-[0.16em] px-7 py-3.5 hover:bg-white transition-colors"
                  >
                    {slide.cta}
                  </Link>
                ) : null}
              </div>
            </div>
          )
        })()}

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-[3] h-11 w-11 flex items-center justify-center border border-white/30 text-[#f5ebe4] bg-[#1a0f0d]/30 backdrop-blur-sm hover:bg-[#1a0f0d]/60 transition"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-[3] h-11 w-11 flex items-center justify-center border border-white/30 text-[#f5ebe4] bg-[#1a0f0d]/30 backdrop-blur-sm hover:bg-[#1a0f0d]/60 transition"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <div className="absolute bottom-5 left-0 right-0 z-[3] flex justify-center gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setPaused(true)
                    setIndex(i)
                    setTimeout(() => setPaused(false), 8000)
                  }}
                  className={`h-1 rounded-full transition-all ${
                    i === index ? 'w-8 bg-[#f5ebe4]' : 'w-1.5 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
