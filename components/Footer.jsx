'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Logo from '../assets/logo/Asset 7.png'
import { SITE } from '@/lib/site'
import { DEFAULT_FOOTER_SECTIONS } from '@/lib/footerDefaults'

const Footer = () => {
  const [footerSections, setFooterSections] = useState(DEFAULT_FOOTER_SECTIONS)

  useEffect(() => {
    const fetchFooterMenu = async () => {
      try {
        const settingsRes = await fetch('/api/store/settings', { cache: 'no-store' })
        const settingsData = await settingsRes.json()
        const remote = settingsData.settings?.footerSections
        if (Array.isArray(remote) && remote.length > 0) {
          setFooterSections(remote)
        }
      } catch (error) {
        console.error('Error fetching footer menu:', error)
      }
    }

    fetchFooterMenu()
  }, [])

  const InstagramIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  )
  const FacebookIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
  )
  const socialIcons = [
    { icon: InstagramIcon, link: 'https://www.instagram.com/nilaas.in/', label: 'Instagram' },
    { icon: FacebookIcon, link: 'https://www.facebook.com/people/Nilaas/61584111974438/', label: 'Facebook' },
  ]

  const paymentIcons = ['Visa', 'Mastercard', 'UPI', 'Razorpay', 'Netbanking']

  const visibleSections = (footerSections || []).filter(
    (section) => section?.title && Array.isArray(section.links) && section.links.some((l) => l?.name)
  )

  return (
    <footer className="bg-[#1a0f0d] text-[#f5ebe4]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-14 sm:pt-16 pb-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-2">
            <Link href="/" className="inline-block mb-5">
              <Image
                src={Logo}
                alt={SITE.name}
                width={120}
                height={120}
                className="object-contain h-16 w-auto brightness-0 invert opacity-95"
                priority
              />
            </Link>
            <p className="text-sm text-[#c9a99a] leading-relaxed max-w-xs mb-5">
              {SITE.tagline}. Everyday ethnic wear, ready for every occasion.
            </p>
            <div className="space-y-2 text-sm text-[#d4c4bb]">
              <a href={`mailto:${SITE.email}`} className="block hover:text-white transition">
                {SITE.email}
              </a>
              <a href={`tel:${SITE.phoneTel}`} className="block hover:text-white transition">
                {SITE.phone}
              </a>
              <a
                href={`https://wa.me/${SITE.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[#f5ebe4] border-b border-[#f5ebe4]/40 pb-0.5 hover:border-[#f5ebe4] transition"
              >
                WhatsApp us
              </a>
            </div>
          </div>

          {/* Dynamic sections from dashboard */}
          {visibleSections.map((section, index) => (
            <div key={`${section.title}-${index}`}>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c9a99a] mb-4">
                {section.title}
              </h3>
              <ul className="space-y-2.5">
                {section.links
                  .filter((link) => link?.name)
                  .map((link, i) => (
                    <li key={`${link.name}-${i}`}>
                      {String(link.link || '').startsWith('http') ||
                      String(link.link || '').startsWith('mailto:') ||
                      String(link.link || '').startsWith('tel:') ? (
                        <a
                          href={link.link}
                          target={String(link.link).startsWith('http') ? '_blank' : undefined}
                          rel={String(link.link).startsWith('http') ? 'noopener noreferrer' : undefined}
                          className="text-sm text-[#e8ddd4]/85 hover:text-white transition"
                        >
                          {link.name}
                        </a>
                      ) : (
                        <Link
                          href={link.link || '#'}
                          className="text-sm text-[#e8ddd4]/85 hover:text-white transition"
                        >
                          {link.name}
                        </Link>
                      )}
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#c9a99a] mb-3">Follow us</p>
              <div className="flex items-center gap-3">
                {socialIcons.map((item) => (
                  <Link
                    href={item.link}
                    key={item.label}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={item.label}
                    className="h-10 w-10 flex items-center justify-center border border-white/15 text-[#e8ddd4] hover:bg-white/10 hover:text-white transition"
                  >
                    <item.icon />
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#c9a99a] mb-3">We accept</p>
              <div className="flex flex-wrap items-center gap-2">
                {paymentIcons.map((payment) => (
                  <span
                    key={payment}
                    className="border border-white/15 px-2.5 py-1 text-[11px] tracking-wide text-[#d4c4bb]"
                  >
                    {payment}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-6 border-t border-white/10">
            <p className="text-sm text-[#9a7d72]">
              © {new Date().getFullYear()} {SITE.name}. All rights reserved.
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <Link href="/terms" className="text-sm text-[#9a7d72] hover:text-white transition">
                Terms
              </Link>
              <Link href="/privacy" className="text-sm text-[#9a7d72] hover:text-white transition">
                Privacy
              </Link>
              <Link href="/shipping-policy" className="text-sm text-[#9a7d72] hover:text-white transition">
                Shipping
              </Link>
              <Link href="/return-policy" className="text-sm text-[#9a7d72] hover:text-white transition">
                Returns
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
