'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'

// Lightweight client-side cache to speed up first paint
const CACHE_KEY = 'hero-banners:v3'
const CACHE_TTL_MS = 60 * 1000 // 1 minute

function mapBannersToSlides(banners) {
  const active = Array.isArray(banners) ? banners.filter(b => b && b.isActive !== false) : []
  return active.map(banner => ({
    image: banner.image || '',
    mobileImage: banner.mobileImage || banner.image || '',
    badge: banner.badge || '',
    subtitle: banner.subtitle || '',
    title: banner.title || '',
    description: banner.description || '',
    cta: banner.cta || '',
    link: banner.link || '/shop',
    showTitle: banner.showTitle !== undefined ? banner.showTitle : true,
    showSubtitle: banner.showSubtitle !== undefined ? banner.showSubtitle : true,
    showBadge: banner.showBadge !== undefined ? banner.showBadge : true,
    showButton: banner.showButton !== undefined ? banner.showButton : true
  }))
}

function SlideCard({ slide, eager = false }) {
  return (
    <div className="relative w-full h-full overflow-hidden rounded-xl sm:rounded-2xl shadow-2xl bg-gray-200">
      {slide.image ? (
        <img
          src={slide.image}
          alt={slide.title || 'Banner'}
          className="absolute inset-0 w-full h-full object-cover"
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onError={(e) => {
            console.error('Hero banner image failed:', slide.image)
            e.currentTarget.style.display = 'none'
          }}
        />
      ) : null}

      <div className="absolute inset-0 flex items-center bg-gradient-to-r from-black/40 to-transparent">
        <div className="px-6 sm:px-12 lg:px-20 max-w-2xl text-white">
          {slide.showBadge && slide.badge && (
            <span className="inline-block mb-4 px-4 py-1.5 border border-white/60 rounded-full text-xs tracking-wide bg-white/10 backdrop-blur">
              {slide.badge}
            </span>
          )}

          {slide.showSubtitle && slide.subtitle && (
            <p className="text-sm sm:text-lg mb-2 tracking-wide text-white/90">
              {slide.subtitle}
            </p>
          )}

          {slide.showTitle && slide.title && (
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-serif font-bold mb-4 drop-shadow-2xl">
              {slide.title}
            </h1>
          )}

          {slide.description && (
            <p className="text-sm sm:text-base lg:text-lg text-white/85 mb-6 max-w-xl line-clamp-3">
              {slide.description}
            </p>
          )}

          {slide.showButton && slide.cta && slide.link && (
            <Link
              href={slide.link}
              className="inline-block bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-8 py-3 text-xs sm:text-sm font-semibold tracking-widest uppercase transition-all duration-300 hover:scale-105 shadow-xl rounded"
            >
              {slide.cta}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Hero({ initialSlides = [] }) {
  const [slides, setSlides] = useState(initialSlides || [])
  const [loading, setLoading] = useState(!(initialSlides && initialSlides.length > 0))
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [currentTranslate, setCurrentTranslate] = useState(0)
  const [prevTranslate, setPrevTranslate] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(true)

  const isLooping = slides.length > 1

  // Fetch banners with sessionStorage SWR-style cache and timeout
  useEffect(() => {
    let aborted = false
    try {
      const raw = sessionStorage.getItem(CACHE_KEY)
      if (raw) {
        const cached = JSON.parse(raw)
        if (cached && Array.isArray(cached.slides) && cached.slides.length > 0 && (Date.now() - cached.ts < CACHE_TTL_MS)) {
          setSlides(cached.slides)
          setLoading(false)
        }
      }
    } catch {}

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort('timeout'), 6000)
    ;(async () => {
      try {
        const res = await fetch('/api/store/hero-banners', { cache: 'no-store', signal: controller.signal })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        const dbSlides = mapBannersToSlides(data?.banners || [])
        if (!aborted) {
          setSlides(dbSlides)
          setLoading(false)
          setIndex(0)
          try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), slides: dbSlides }))
          } catch {}
        }
      } catch (error) {
        const isAbort =
          aborted ||
          error?.name === 'AbortError' ||
          error?.code === 20 ||
          /aborted|AbortError/i.test(String(error?.message || error || ''))
        if (isAbort) return
        console.error('Error fetching banners:', error?.message || error)
        if (!aborted) setLoading(false)
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

  // Infinite loop reset (only when 2+ slides)
  useEffect(() => {
    if (!isLooping) return
    if (index === slides.length) {
      const t1 = setTimeout(() => {
        setIsTransitioning(false)
        setIndex(0)
      }, 700)
      const t2 = setTimeout(() => setIsTransitioning(true), 750)
      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
      }
    }
    if (index === -1) {
      const t1 = setTimeout(() => {
        setIsTransitioning(false)
        setIndex(slides.length - 1)
      }, 700)
      const t2 = setTimeout(() => setIsTransitioning(true), 750)
      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
      }
    }
  }, [index, slides.length, isLooping])

  const prev = () => {
    if (!isLooping) return
    setPaused(true)
    setIndex((i) => i - 1)
    setTimeout(() => setPaused(false), 8000)
  }

  const next = () => {
    if (!isLooping) return
    setPaused(true)
    setIndex((i) => i + 1)
    setTimeout(() => setPaused(false), 8000)
  }

  const handleDragStart = (e) => {
    if (!isLooping) return
    setIsDragging(true)
    setPaused(true)
    setStartX(e.type.includes('mouse') ? e.pageX : e.touches[0].clientX)
  }

  const handleDragMove = (e) => {
    if (!isDragging || !isLooping) return
    const currentPosition = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX
    const diff = currentPosition - startX
    setCurrentTranslate(prevTranslate + diff)
  }

  const handleDragEnd = () => {
    if (!isDragging || !isLooping) return
    setIsDragging(false)

    const movedBy = currentTranslate - prevTranslate

    if (movedBy < -100) {
      setIndex((i) => i + 1)
    } else if (movedBy > 100) {
      setIndex((i) => i - 1)
    }

    setCurrentTranslate(0)
    setPrevTranslate(0)
    setTimeout(() => setPaused(false), 8000)
  }

  // Clone first/last only when there are 2+ banners (infinite carousel).
  // With 1 banner, cloning made it look like 3 sliders.
  const trackSlides = useMemo(() => {
    if (slides.length === 0) return []
    if (!isLooping) return slides
    return [...slides.slice(-1), ...slides, ...slides.slice(0, 1)]
  }, [slides, isLooping])

  const trackIndex = isLooping ? index + 1 : index

  if (loading) {
    return (
      <section className="relative w-full bg-white py-6 sm:py-8">
        <div className="relative h-[280px] sm:h-[350px] lg:h-[400px] xl:h-[470px] 2xl:h-[540px] overflow-hidden px-4 sm:px-8 bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center rounded-xl animate-pulse">
          <div className="text-center text-gray-400">
            <div className="w-12 h-12 border-4 border-gray-300 border-t-red-600 rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      </section>
    )
  }

  if (slides.length === 0) {
    return null
  }

  return (
    <section className="relative w-full bg-white py-4 sm:py-6">
      <div className="relative h-[290px] sm:h-[360px] lg:h-[410px] xl:h-[480px] 2xl:h-[560px] overflow-hidden px-4 sm:px-8">
        <div
          className={`flex gap-4 h-full w-full ${isLooping ? 'cursor-grab active:cursor-grabbing' : ''}`}
          style={{
            transform: `translateX(calc(-${trackIndex * 100}% - ${trackIndex * 16}px))`,
            transition: isDragging || !isTransitioning ? 'none' : 'transform 800ms cubic-bezier(0.4, 0, 0.2, 1)',
            willChange: isLooping ? 'transform' : 'auto'
          }}
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
        >
          {trackSlides.map((slide, i) => (
            <div key={`slide-${i}`} className="flex-shrink-0 w-full h-full">
              <SlideCard slide={slide} eager={i === (isLooping ? 1 : 0)} />
            </div>
          ))}
        </div>

        {isLooping && (
          <>
            <button
              onClick={prev}
              className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white rounded-full p-3 sm:p-3.5 shadow-xl transition-all duration-300 hover:scale-110 backdrop-blur"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900" />
            </button>
            <button
              onClick={next}
              className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white rounded-full p-3 sm:p-3.5 shadow-xl transition-all duration-300 hover:scale-110 backdrop-blur"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900" />
            </button>

            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2.5 z-20">
              {slides.map((_, i) => (
                <button
                  key={`dot-${i}`}
                  onClick={() => {
                    setPaused(true)
                    setIndex(i)
                    setTimeout(() => setPaused(false), 8000)
                  }}
                  className={`rounded-full transition-all ${
                    i === (index < 0 ? slides.length - 1 : index >= slides.length ? 0 : index)
                      ? 'w-10 sm:w-12 h-1.5 bg-red-600'
                      : 'w-1.5 h-1.5 bg-white/70 hover:bg-white'
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
