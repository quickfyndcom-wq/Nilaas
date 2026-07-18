'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import axios from 'axios'
import { SITE } from '@/lib/site'

const DEFAULTS = {
  backgroundColor: '#ffffff',
  leftSection: {
    title: 'The gift edit',
    titleColor: '#2a1210',
    subtitle: 'Thoughtful dresses & co-ords for every celebration',
    subtitleColor: '#6e5048',
    price: 'From ₹649',
    priceColor: '#6b2f28',
    buttonText: 'Shop gifts',
    buttonLink: '/shop',
    buttonColor: '#2a1210',
    buttonBgColor: '#2a1210',
  },
  rightSection: {
    branding: SITE.name,
    brandingColor: '#8a5a4a',
    title: 'Need a second opinion?',
    titleColor: '#2a1210',
    subtitle: 'Style help on WhatsApp',
    subtitleColor: '#6b2f28',
    description1: 'Share a screenshot or occasion — we’ll help you pick',
    description1Color: '#6e5048',
    description2: 'the right fit and fabric.',
    description2Color: '#2a1210',
    buttonText: 'WhatsApp us',
    buttonLink: `https://wa.me/${SITE.whatsapp}`,
    buttonColor: '#2a1210',
    buttonBgColor: '#2a1210',
  },
}

export default function PromotionBanner() {
  const [settings, setSettings] = useState(DEFAULTS)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const fetchData = async () => {
    try {
      const settingsRes = await axios.get('/api/store/settings')
      const remote = settingsRes.data.settings?.section6PromotionBanner
      if (remote) {
        setSettings({
          ...DEFAULTS,
          ...remote,
          leftSection: { ...DEFAULTS.leftSection, ...(remote.leftSection || {}) },
          rightSection: { ...DEFAULTS.rightSection, ...(remote.rightSection || {}) },
        })
      }
    } catch (error) {
      console.error('Error fetching section 6 data:', error)
    }
  }

  const left = settings.leftSection || DEFAULTS.leftSection
  const right = settings.rightSection || DEFAULTS.rightSection

  return (
    <section
      className={`w-full border-y border-[#2a1210]/08 ${ready ? 'pb-ready' : ''}`}
      style={{ backgroundColor: '#ffffff' }}
    >
      <style jsx>{`
        @keyframes pbRise {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .pb-panel {
          opacity: 0;
        }
        .pb-ready .pb-panel {
          animation: pbRise 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .pb-ready .pb-panel-2 {
          animation-delay: 0.12s;
        }
      `}</style>

      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Left promo */}
          <div className="pb-panel pb-panel-1 py-14 sm:py-16 lg:py-20 lg:pr-12 lg:border-r border-[#2a1210]/10">
            <p className="text-[11px] tracking-[0.28em] uppercase text-[#8a5a4a] mb-4">
              {SITE.name}
            </p>
            <h3
              className="font-serif text-3xl sm:text-4xl leading-tight mb-3"
              style={{ color: left.titleColor }}
            >
              {left.title}
            </h3>
            <p className="text-sm leading-relaxed max-w-sm mb-3" style={{ color: left.subtitleColor }}>
              {left.subtitle}
            </p>
            {left.price ? (
              <p
                className="text-xs font-semibold uppercase tracking-[0.16em] mb-8"
                style={{ color: left.priceColor }}
              >
                {left.price}
              </p>
            ) : (
              <div className="mb-8" />
            )}
            <Link
              href={left.buttonLink || '/shop'}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-[#f5ebe4] transition-colors hover:opacity-90"
              style={{ backgroundColor: left.buttonBgColor || left.buttonColor || '#2a1210' }}
            >
              {left.buttonText || 'Shop now'}
            </Link>
          </div>

          {/* Right promo */}
          <div className="pb-panel pb-panel-2 py-14 sm:py-16 lg:py-20 lg:pl-12 border-t lg:border-t-0 border-[#2a1210]/10">
            <p
              className="text-[11px] tracking-[0.28em] uppercase mb-4"
              style={{ color: right.brandingColor }}
            >
              {right.branding || SITE.name}
            </p>
            <h2
              className="font-serif text-3xl sm:text-4xl leading-tight mb-2"
              style={{ color: right.titleColor }}
            >
              {right.title}
            </h2>
            {right.subtitle ? (
              <p className="font-serif text-xl sm:text-2xl mb-5" style={{ color: right.subtitleColor }}>
                {right.subtitle}
              </p>
            ) : null}
            <div className="mb-8 max-w-sm space-y-1">
              {right.description1 ? (
                <p className="text-sm leading-relaxed" style={{ color: right.description1Color }}>
                  {right.description1}
                </p>
              ) : null}
              {right.description2 ? (
                <p className="text-sm font-medium leading-relaxed" style={{ color: right.description2Color }}>
                  {right.description2}
                </p>
              ) : null}
            </div>
            <Link
              href={right.buttonLink || '/shop'}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold uppercase tracking-wide border transition-colors hover:bg-[#2a1210] hover:text-[#f5ebe4]"
              style={{
                borderColor: right.buttonColor || '#2a1210',
                color: right.buttonColor || '#2a1210',
              }}
            >
              {right.buttonText || 'Learn more'}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
