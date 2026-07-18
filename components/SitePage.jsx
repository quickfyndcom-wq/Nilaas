import Link from 'next/link'
import { SITE } from '@/lib/site'

const POLICY_LINKS = [
  { href: '/about-us', label: 'About us' },
  { href: '/contact-us', label: 'Contact' },
  { href: '/support', label: 'Support' },
  { href: '/faq', label: 'FAQs' },
  { href: '/terms', label: 'Terms' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/shipping-policy', label: 'Shipping' },
  { href: '/return-policy', label: 'Returns' },
  { href: '/refund-policy', label: 'Refunds' },
  { href: '/cancellation-policy', label: 'Cancellation' },
  { href: '/cookie-policy', label: 'Cookies' },
  { href: '/disclaimer', label: 'Disclaimer' },
]

/**
 * Shared layout for About / Contact / Support / legal & policy pages.
 */
export default function SitePage({
  title,
  subtitle,
  children,
  showNav = true,
  wide = false,
}) {
  return (
    <main className="min-h-screen bg-white text-[#2a1210]">
      <header className="border-b border-[#2a1210]/10 bg-[#faf7f4]">
        <div className={`${wide ? 'max-w-5xl' : 'max-w-3xl'} mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center`}>
          <p className="text-[11px] tracking-[0.28em] uppercase text-[#8a5a4a] mb-4">{SITE.name}</p>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#2a1210] mb-3">{title}</h1>
          {subtitle ? (
            <p className="text-sm sm:text-base text-[#6e5048] max-w-xl mx-auto leading-relaxed">{subtitle}</p>
          ) : null}
        </div>
      </header>

      {showNav && (
        <nav className="border-b border-[#2a1210]/08 bg-white sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap gap-2 justify-center">
            {POLICY_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-[11px] sm:text-xs font-semibold uppercase tracking-wide px-2.5 py-1.5 rounded-md text-[#6b2f28] hover:bg-[#f3f0ee] transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </nav>
      )}

      <div className={`${wide ? 'max-w-5xl' : 'max-w-3xl'} mx-auto px-4 sm:px-6 py-10 sm:py-14`}>
        <div className="prose-nilaas space-y-6 text-[15px] leading-relaxed text-[#4a3832]">
          {children}
        </div>
      </div>
    </main>
  )
}

export function Section({ title, children }) {
  return (
    <section className="space-y-3">
      {title ? (
        <h2 className="font-serif text-2xl text-[#2a1210] border-b border-[#2a1210]/10 pb-2">{title}</h2>
      ) : null}
      <div className="space-y-3">{children}</div>
    </section>
  )
}

export function PolicyMeta({ updated = '17 July 2026' }) {
  return (
    <p className="text-xs text-[#9a7d72]">
      Last updated: {updated} · {SITE.name} ({SITE.url.replace(/^https?:\/\//, '')})
    </p>
  )
}
