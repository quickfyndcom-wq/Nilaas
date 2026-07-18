'use client'

import Link from 'next/link'
import { SITE } from '@/lib/site'

const LINKS = [
  {
    label: 'Dresses',
    href: '/category/dresses',
    image:
      'https://images.unsplash.com/photo-1740992556357-f7fe9afff763?auto=format&fit=crop&w=900&q=80',
  },
  {
    label: 'Kurtis',
    href: '/category/kurtis',
    image:
      'https://images.unsplash.com/photo-1743229995753-69be4b438204?auto=format&fit=crop&w=900&q=80',
  },
  {
    label: 'Ethnic wear',
    href: '/category/ethnic-wear',
    image:
      'https://images.unsplash.com/photo-1742800786544-e935375035e3?auto=format&fit=crop&w=900&q=80',
  },
  {
    label: 'New arrivals',
    href: '/category/new-arrivals',
    image:
      'https://images.unsplash.com/photo-1766994063823-ed214f883548?auto=format&fit=crop&w=900&q=80',
  },
]

/** Soft landing strip between hero banner and the Nilaas edit carousel */
export default function HomeWelcomeStrip() {
  return (
    <section className="w-full bg-white">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12 sm:py-14 lg:py-16">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8 sm:mb-10">
          <div>
            <p className="text-[11px] tracking-[0.28em] uppercase text-[#8a5a4a] mb-2">
              {SITE.name}
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-[2.35rem] text-[#2a1210] leading-tight">
              Everyday ethnic, ready to wear
            </h2>
          </div>
          <p className="text-sm text-[#6e5048] max-w-sm leading-relaxed md:text-right">
            Cotton dresses, kurtis & co-ords — made for Kerala days and festive nights.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {LINKS.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              className="group relative block aspect-[4/5] overflow-hidden bg-[#1a0f0d] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2a1210]"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <img
                src={item.image}
                alt={item.label}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a0f0d]/85 via-[#1a0f0d]/15 to-transparent" />
              <span className="absolute inset-x-0 bottom-0 p-4 sm:p-5 text-[12px] sm:text-[13px] font-semibold uppercase tracking-[0.18em] text-[#f5ebe4]">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
