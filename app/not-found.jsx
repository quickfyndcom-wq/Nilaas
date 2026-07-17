import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="relative min-h-[60vh] bg-gradient-to-b from-amber-50 via-white to-rose-50 text-gray-900">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-amber-200/50 blur-3xl" />
        <div className="absolute -right-10 bottom-10 h-72 w-72 rounded-full bg-rose-200/40 blur-3xl" />
      </div>

      <main className="relative mx-auto max-w-5xl px-4 py-16 md:py-24">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-200/80 bg-white/70 px-4 py-2 text-sm font-semibold text-amber-700 shadow-sm backdrop-blur">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
          Fine Jewellery Destination
        </div>

        <div className="grid gap-12 md:grid-cols-[1.2fr_0.8fr] md:items-center">
          <div className="space-y-6">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-amber-600">404 • Page Missing</p>
              <h1 className="mt-3 text-4xl font-bold leading-tight text-gray-900 md:text-5xl">
                This sparkle is missing, but your perfect piece is still here.
              </h1>
              <p className="mt-3 text-lg text-gray-600 md:max-w-xl">
                The page you are looking for has moved or no longer exists. Discover curated gold and diamond pieces crafted to shine every day.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/products"
                className="rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-200 transition hover:-translate-y-0.5 hover:bg-amber-600"
              >
                Shop All Jewellery
              </Link>
              <Link
                href="/fast-delivery"
                className="rounded-full border border-amber-200 bg-white/80 px-5 py-3 text-sm font-semibold text-amber-700 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:bg-white"
              >
                Explore Gold Styles
              </Link>
              <Link
                href="/help-center"
                className="rounded-full border border-gray-200 bg-white/70 px-5 py-3 text-sm font-semibold text-gray-800 shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 hover:bg-white"
              >
                Visit Help Center
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-amber-100 bg-white/80 p-4 shadow-sm">
                <p className="text-sm font-semibold text-amber-700">Certified Craft</p>
                <p className="mt-1 text-sm text-gray-600">Hallmarked gold and conflict-free diamonds you can trust.</p>
              </div>
              <div className="rounded-2xl border border-amber-100 bg-white/80 p-4 shadow-sm">
                <p className="text-sm font-semibold text-amber-700">Insured Delivery</p>
                <p className="mt-1 text-sm text-gray-600">Secure packaging with real-time tracking to your doorstep.</p>
              </div>
              <div className="rounded-2xl border border-amber-100 bg-white/80 p-4 shadow-sm">
                <p className="text-sm font-semibold text-amber-700">Concierge Support</p>
                <p className="mt-1 text-sm text-gray-600">Style experts to help you pick the perfect piece.</p>
              </div>
            </div>
          </div>

          <div className="relative rounded-3xl border border-amber-100/80 bg-white/80 p-8 shadow-xl backdrop-blur">
            <div className="absolute -left-6 -top-6 h-16 w-16 rounded-full bg-amber-400/40 blur-xl" aria-hidden="true" />
            <div className="absolute -right-4 bottom-8 h-20 w-20 rounded-full bg-rose-200/50 blur-xl" aria-hidden="true" />
            <div className="relative space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">Curated Picks</p>
              <h2 className="text-2xl font-bold text-gray-900">Browse our signature collections</h2>
              <div className="space-y-3">
                {["Everyday Gold Essentials", "Diamond Solitaires", "Wedding & Gifts"].map((title) => (
                  <Link
                    key={title}
                    href="/products"
                    className="flex items-center justify-between rounded-2xl border border-amber-100 bg-white/90 px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-200"
                  >
                    <span>{title}</span>
                    <span className="text-amber-600">Shop now →</span>
                  </Link>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border border-dashed border-amber-200/80 bg-amber-50/60 px-4 py-3 text-sm text-amber-800">
                New arrivals drop weekly. Stay tuned for handcrafted pieces made to last a lifetime.
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
