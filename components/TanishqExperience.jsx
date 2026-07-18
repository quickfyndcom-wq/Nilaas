'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import axios from 'axios'
import { SITE } from '@/lib/site'

const DEFAULT_HEADING = {
  title: 'The Nilaas edit',
  subtitle: 'Ways to shop, style, and visit us',
}

const DEFAULT_EXPERIENCES = [
  {
    title: 'Visit our store',
    image: '/find-store-fashion-hero.png',
    link: '/find-store',
  },
  {
    title: 'New arrivals',
    image:
      'https://images.unsplash.com/photo-1743229995753-69be4b438204?auto=format&fit=crop&w=1200&q=80',
    link: '/shop?category=new-arrivals',
  },
  {
    title: 'Shop dresses',
    image:
      'https://images.unsplash.com/photo-1740992556357-f7fe9afff763?auto=format&fit=crop&w=1200&q=80',
    link: '/shop?category=dresses',
  },
  {
    title: 'WhatsApp us',
    image:
      'https://images.unsplash.com/photo-1742800786544-e935375035e3?auto=format&fit=crop&w=1200&q=80',
    link: `https://wa.me/${SITE.whatsapp}`,
  },
  {
    title: 'Style notes',
    image:
      'https://images.unsplash.com/photo-1766994063823-ed214f883548?auto=format&fit=crop&w=1200&q=80',
    link: '/blog',
  },
  {
    title: 'Help & sizing',
    image:
      'https://images.unsplash.com/photo-1758985402638-6028bae83b98?auto=format&fit=crop&w=1200&q=80',
    link: '/faq',
  },
]

export default function NilaasExperience() {
  const [heading, setHeading] = useState(DEFAULT_HEADING)
  const [experiences, setExperiences] = useState(DEFAULT_EXPERIENCES)
  const [loading, setLoading] = useState(true)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (!loading) {
      const id = requestAnimationFrame(() => setReady(true))
      return () => cancelAnimationFrame(id)
    }
  }, [loading])

  const fetchData = async () => {
    try {
      const settingsRes = await axios.get('/api/store/settings')
      const remoteHeading = settingsRes.data.settings?.section7Heading
      const remoteExperiences = settingsRes.data.settings?.section7Experiences

      if (remoteHeading?.title) {
        setHeading({ ...DEFAULT_HEADING, ...remoteHeading })
      }

      if (Array.isArray(remoteExperiences) && remoteExperiences.length > 0) {
        const validExperiences = remoteExperiences
          .map((exp, i) => ({
            title: exp.title || DEFAULT_EXPERIENCES[i]?.title || '',
            image:
              exp.image ||
              exp.imageUrl ||
              exp.bannerImage ||
              DEFAULT_EXPERIENCES[i]?.image ||
              '',
            link: exp.link || DEFAULT_EXPERIENCES[i]?.link || '/shop',
          }))
          .filter((exp) => exp.title)
        if (validExperiences.length > 0) setExperiences(validExperiences)
      }
    } catch (error) {
      console.error('Error fetching section 7 data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="w-full bg-[#f3ebe4] py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-12">
            <div className="h-10 w-64 bg-[#e8ddd4] mx-auto mb-3 animate-pulse" />
            <div className="h-4 w-48 bg-[#e8ddd4] mx-auto animate-pulse" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="aspect-[3/4] bg-[#e8ddd4] animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className={`w-full bg-[#f3ebe4] py-16 sm:py-20 lg:py-24 ${ready ? 'nx-ready' : ''}`}>
      <style jsx>{`
        @keyframes nxRise {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .nx-item {
          opacity: 0;
        }
        .nx-ready .nx-item {
          animation: nxRise 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .nx-ready .nx-item:nth-child(1) {
          animation-delay: 0.04s;
        }
        .nx-ready .nx-item:nth-child(2) {
          animation-delay: 0.1s;
        }
        .nx-ready .nx-item:nth-child(3) {
          animation-delay: 0.16s;
        }
        .nx-ready .nx-item:nth-child(4) {
          animation-delay: 0.22s;
        }
        .nx-ready .nx-item:nth-child(5) {
          animation-delay: 0.28s;
        }
        .nx-ready .nx-item:nth-child(6) {
          animation-delay: 0.34s;
        }
      `}</style>

      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="text-center mb-10 sm:mb-14">
          <p className="text-[11px] tracking-[0.28em] uppercase text-[#8a5a4a] mb-3">
            {SITE.name}
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#2a1210] mb-3">
            {heading.title}
          </h2>
          <p className="text-sm sm:text-base text-[#6e5048] max-w-md mx-auto leading-relaxed">
            {heading.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {experiences.map((experience, index) => {
            const isExternal = experience.link?.startsWith('http')
            const className =
              'nx-item group relative block aspect-[3/4] overflow-hidden bg-[#1a0f0d] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2a1210]'

            const inner = (
              <>
                {experience.image ? (
                  <img
                    src={experience.image}
                    alt={experience.title}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#2a1210] to-[#6b2f28]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a0f0d]/90 via-[#1a0f0d]/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                  <h3 className="text-[12px] sm:text-[13px] font-semibold uppercase tracking-[0.18em] text-[#f5ebe4]">
                    {experience.title}
                  </h3>
                  <span className="mt-2 inline-block text-[11px] tracking-wide text-[#c9a99a] opacity-0 translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                    Explore →
                  </span>
                </div>
              </>
            )

            if (isExternal) {
              return (
                <a
                  key={index}
                  href={experience.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={className}
                >
                  {inner}
                </a>
              )
            }

            return (
              <Link key={index} href={experience.link || '/shop'} className={className}>
                {inner}
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
