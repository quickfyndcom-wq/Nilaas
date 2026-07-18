'use client'

import Link from 'next/link'
import { SITE } from '@/lib/site'

/** Editorial moment between the product edit carousel and category shop */
export default function HomeFeaturedMoment() {
  return (
    <section className="w-full bg-[#1a0f0d]">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[420px] lg:min-h-[480px]">
        <div className="relative min-h-[280px] lg:min-h-full overflow-hidden">
          <img
            src="/find-store-fashion-hero.png"
            alt="Nilaas store visit"
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1a0f0d]/20 to-transparent lg:bg-gradient-to-t lg:from-[#1a0f0d]/30 lg:to-transparent" />
        </div>

        <div className="flex flex-col justify-center px-6 sm:px-10 lg:px-14 xl:px-16 py-14 sm:py-16 text-[#f5ebe4]">
          <p className="text-[11px] tracking-[0.28em] uppercase text-[#c9a99a] mb-4">
            {SITE.name} store
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-[2.75rem] leading-[1.1] mb-4">
            Try it on in store
          </h2>
          <p className="text-[15px] sm:text-base text-[#d4c4bb] leading-relaxed max-w-md mb-8">
            Walk into our boutique — feel the cotton, check the fit, and leave with something
            you love.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/find-store"
              className="inline-flex items-center justify-center bg-[#f5ebe4] text-[#1a0f0d] text-[12px] font-semibold uppercase tracking-[0.16em] px-6 py-3.5 hover:bg-white transition-colors"
            >
              Find store
            </Link>
            <Link
              href="/shop"
              className="inline-flex items-center text-[12px] font-semibold uppercase tracking-[0.16em] text-[#f5ebe4] border-b border-[#f5ebe4]/50 pb-0.5 hover:border-[#f5ebe4] transition-colors"
            >
              Shop online →
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
