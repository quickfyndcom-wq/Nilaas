'use client'

import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Link from 'next/link'
import ProductCard from '@/components/ProductCard'
import { fetchProducts } from '@/lib/features/product/productSlice'
import { SITE } from '@/lib/site'

const DISPLAY_COUNT = 8

function SkeletonCard() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[4/5] bg-[#e8ddd4]" />
      <div className="pt-3.5 space-y-2">
        <div className="h-2.5 w-16 bg-[#e8ddd4]" />
        <div className="h-4 w-3/4 bg-[#e8ddd4]" />
        <div className="h-4 w-20 bg-[#e8ddd4]" />
      </div>
    </div>
  )
}

export default function HomeProductGrid({
  title = 'Shop the collection',
  subtitle = 'Fresh styles from the Nilaas edit',
  limit = DISPLAY_COUNT,
  offset = 0,
  viewAllHref = '/shop',
}) {
  const dispatch = useDispatch()
  const products = useSelector((state) => state.product.list || [])
  const [loading, setLoading] = useState(products.length === 0)

  useEffect(() => {
    let active = true
    const load = async () => {
      if (products.length > 0) {
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        await dispatch(fetchProducts({ limit: Math.max(limit + offset, 24) })).unwrap()
      } catch {
        // keep empty state
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [dispatch, products.length, limit, offset])

  const items = useMemo(() => {
    return [...products]
      .filter((p) => p && (p._id || p.id) && (p.slug || p.name))
      .slice(offset, offset + limit)
  }, [products, limit, offset])

  if (!loading && items.length === 0) return null

  return (
    <section className="w-full bg-[#f3ebe4] py-14 sm:py-16 lg:py-20">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 sm:mb-12">
          <div>
            <p className="text-[11px] tracking-[0.28em] uppercase text-[#8a5a4a] mb-3">
              {SITE.name}
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#2a1210] mb-2">
              {title}
            </h2>
            <p className="text-sm sm:text-base text-[#6e5048] max-w-md leading-relaxed">
              {subtitle}
            </p>
          </div>
          <Link
            href={viewAllHref}
            className="inline-flex items-center text-[12px] font-semibold uppercase tracking-[0.18em] text-[#2a1210] border-b border-[#2a1210] pb-0.5 hover:text-[#6b2f28] hover:border-[#6b2f28] transition-colors self-start sm:self-auto"
          >
            View all
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-10">
          {loading
            ? Array.from({ length: limit }).map((_, i) => <SkeletonCard key={i} />)
            : items.map((product) => (
                <ProductCard key={product._id || product.id} product={product} />
              ))}
        </div>
      </div>
    </section>
  )
}
