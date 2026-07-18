import Link from 'next/link'
import Image from 'next/image'
import logo from '@/assets/logo/Asset 7.png'

const QUICK_LINKS = [
  { href: '/category/dresses', label: 'Dresses' },
  { href: '/category/kurtis', label: 'Kurtis' },
  { href: '/category/ethnic-wear', label: 'Ethnic wear' },
  { href: '/category/new-arrivals', label: 'New arrivals' },
]

export default function NotFound() {
  return (
    <div className="relative min-h-[70vh] bg-[#faf6f2] text-[#2a1210]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <main className="relative mx-auto max-w-3xl px-5 py-16 md:py-24 text-center sm:text-left">
        <Link href="/" className="inline-flex items-center mb-10">
          <Image
            src={logo}
            alt="Nilaas"
            width={88}
            height={88}
            className="h-14 w-auto object-contain"
            priority
          />
        </Link>

        <p className="text-[11px] uppercase tracking-[0.28em] text-[#8a5a4a] mb-3">
          404 · Page missing
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl md:text-[2.75rem] leading-tight mb-4">
          This page isn&apos;t here — but your next outfit is.
        </h1>
        <p className="text-base sm:text-lg text-[#6e5048] max-w-xl mb-10 leading-relaxed mx-auto sm:mx-0">
          The link may be outdated. Continue shopping dresses, kurtis, and co-ords at Nilaas —
          everyday ethnic fashion for women.
        </p>

        <div className="flex flex-wrap justify-center sm:justify-start gap-3 mb-12">
          <Link
            href="/shop"
            className="inline-flex items-center justify-center bg-[#2a1210] text-[#f5ebe4] text-[12px] font-semibold uppercase tracking-[0.16em] px-6 py-3.5 hover:opacity-90 transition"
          >
            Shop the collection
          </Link>
          <Link
            href="/"
            className="inline-flex items-center text-[12px] font-semibold uppercase tracking-[0.16em] text-[#2a1210] border-b border-[#2a1210]/50 pb-0.5 hover:border-[#2a1210] transition"
          >
            Back home
          </Link>
          <Link
            href="/find-store"
            className="inline-flex items-center text-[12px] font-semibold uppercase tracking-[0.16em] text-[#6e5048] border-b border-[#6e5048]/40 pb-0.5 hover:border-[#6e5048] transition"
          >
            Find store
          </Link>
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#8a5a4a] mb-4">
            Popular categories
          </p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-2">
            {QUICK_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="border border-[#2a1210]/15 px-4 py-2 text-sm text-[#2a1210] hover:bg-[#2a1210] hover:text-[#f5ebe4] transition"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
