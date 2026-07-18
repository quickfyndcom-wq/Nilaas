'use client'

import { useEffect, useState } from 'react'
import { MapPin, Clock, Navigation, ArrowUpRight } from 'lucide-react'
import { SITE } from '@/lib/site'

const STORE = {
  name: SITE.name,
  city: 'Kozhikode, Kerala',
  address: SITE.address,
  hours: SITE.hours,
  lat: 11.3057105,
  lng: 75.8790061,
  mapEmbed:
    'https://maps.google.com/maps?q=Kunnamangalam+Police+Station,+MLA+Road,+Ambalamukku,+Kunnamangalam,+Kozhikode,+Kerala+673571&z=16&output=embed',
  mapLink:
    'https://www.google.com/maps/dir/?api=1&destination=Nilaas,+MLA+Road+near+Police+Station,+Ambalamukku,+Kunnamangalam,+Kozhikode,+Kerala+673571',
  heroImage: '/find-store-fashion-hero.png',
}

export default function FindStorePage() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div className="min-h-screen bg-[#1a0f0d] text-[#f5ebe4]">
      <style jsx>{`
        @keyframes fsRise {
          from {
            opacity: 0;
            transform: translateY(28px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fsKenBurns {
          from {
            transform: scale(1.08);
          }
          to {
            transform: scale(1);
          }
        }
        @keyframes fsPulse {
          0%,
          100% {
            opacity: 0.45;
          }
          50% {
            opacity: 0.85;
          }
        }
        .fs-rise {
          opacity: 0;
        }
        .fs-ready .fs-rise {
          animation: fsRise 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .fs-ready .fs-rise-1 {
          animation-delay: 0.08s;
        }
        .fs-ready .fs-rise-2 {
          animation-delay: 0.2s;
        }
        .fs-ready .fs-rise-3 {
          animation-delay: 0.34s;
        }
        .fs-ready .fs-rise-4 {
          animation-delay: 0.48s;
        }
        .fs-hero-img {
          animation: fsKenBurns 14s ease-out forwards;
        }
        .fs-pin {
          animation: fsPulse 2.8s ease-in-out infinite;
        }
      `}</style>

      {/* Hero — one composition: brand, headline, line, CTA, full-bleed place image */}
      <section
        className={`relative min-h-[100svh] flex items-end overflow-hidden ${ready ? 'fs-ready' : ''}`}
      >
        <div className="absolute inset-0">
          <img
            src={STORE.heroImage}
            alt="Nilaas fashion dresses — visit our Kozhikode store"
            className="fs-hero-img absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a0f0d] via-[#1a0f0d]/70 to-[#1a0f0d]/25" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(107,47,40,0.35),transparent_55%)]" />
        </div>

        <div className="relative z-10 w-full max-w-6xl mx-auto px-5 sm:px-8 pb-16 sm:pb-24 pt-32">
          <p className="fs-rise fs-rise-1 font-serif text-5xl sm:text-7xl md:text-8xl tracking-tight text-white mb-6">
            {STORE.name}
          </p>
          <h1 className="fs-rise fs-rise-2 text-xl sm:text-2xl md:text-3xl font-medium text-[#f0ddd3] max-w-xl leading-snug mb-4">
            Visit our store in Kozhikode
          </h1>
          <p className="fs-rise fs-rise-3 text-sm sm:text-base text-[#c9a99a] max-w-md leading-relaxed mb-10">
            Try on dresses and co-ords in person at our Kunnamangalam store — the same home base as QuickFynd.
          </p>
          <div className="fs-rise fs-rise-4 flex flex-wrap gap-3">
            <a
              href={STORE.mapLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#f5ebe4] text-[#1a0f0d] text-sm font-semibold tracking-wide uppercase hover:bg-white transition-colors"
            >
              <Navigation className="w-4 h-4" />
              Get directions
            </a>
          </div>
        </div>
      </section>

      {/* Location details */}
      <section className="relative bg-[#faf6f2] text-[#2a1210]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            <div className="lg:col-span-5">
              <p className="text-[11px] tracking-[0.28em] uppercase text-[#8a5a4a] mb-3">
                Our location
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#2a1210] leading-tight mb-4">
                Kunnamangalam, Kozhikode
              </h2>
              <p className="text-[#6e5048] leading-relaxed mb-8">
                Find us on MLA Road near the police station in Ambalamukku — easy to reach from
                Kozhikode city and the Calicut University area.
              </p>

              <div className="space-y-6 border-t border-[#2a1210]/10 pt-8">
                <div className="flex gap-4">
                  <MapPin className="w-5 h-5 text-[#6b2f28] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs uppercase tracking-wider text-[#9a7d72] mb-1">Address</p>
                    <p className="text-[#2a1210] leading-relaxed">{STORE.address}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Clock className="w-5 h-5 text-[#6b2f28] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs uppercase tracking-wider text-[#9a7d72] mb-1">Hours</p>
                    <p className="text-[#2a1210]">{STORE.hours}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="relative aspect-[4/3] sm:aspect-[16/10] overflow-hidden bg-[#1a0f0d]">
                <iframe
                  title="Nilaas store map — Kunnamangalam, Kozhikode"
                  src={STORE.mapEmbed}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0 w-full h-full grayscale-[20%] contrast-[1.05]"
                />
                <div className="pointer-events-none absolute top-4 left-4 flex items-center gap-2 bg-[#1a0f0d]/85 text-[#f5ebe4] px-3 py-2 text-xs tracking-wide">
                  <span className="fs-pin inline-block w-2 h-2 rounded-full bg-[#c45c48]" />
                  Ambalamukku · Kozhikode
                </div>
              </div>
              <a
                href={STORE.mapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#6b2f28] hover:text-[#2a1210] transition-colors"
              >
                Open in Google Maps
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="bg-[#2a1210] text-[#f5ebe4]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-20 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-8">
          <div>
            <p className="font-serif text-3xl sm:text-4xl mb-3">Come say hello</p>
            <p className="text-[#c9a99a] max-w-md leading-relaxed">
              Walk in during store hours — we&apos;ll help you find the right fit, fabric, and finish.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href={STORE.mapLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#f5ebe4] text-[#2a1210] text-sm font-semibold uppercase tracking-wide hover:bg-white transition-colors"
            >
              <Navigation className="w-4 h-4" />
              Directions
            </a>
            <a
              href={`https://wa.me/${SITE.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 border border-[#f5ebe4]/30 text-sm font-semibold uppercase tracking-wide hover:border-[#f5ebe4] transition-colors"
            >
              WhatsApp us
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
