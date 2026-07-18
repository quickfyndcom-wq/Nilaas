import Link from 'next/link'
import SitePage, { Section } from '@/components/SitePage'
import { SITE } from '@/lib/site'

export const metadata = {
  title: `About Us · ${SITE.name}`,
  description:
    'Nilaas is an Indian ladies fashion brand offering thoughtfully designed apparel for everyday elegance and celebration.',
}

export default function AboutUsPage() {
  return (
    <SitePage
      title="About Nilaas"
      subtitle="Indian fashion, made to wear — rooted in Kerala, designed for women who love effortless elegance."
      wide
    >
      <Section title="Who we are">
        <p>
          Nilaas is a contemporary Indian fashion label focused on ladies’ wear — co-ords, festive sets,
          everyday essentials, and pieces that feel special without trying too hard. We believe clothing
          should feel personal: flattering fits, thoughtful fabrics, and colours that belong in a real wardrobe.
        </p>
        <p>
          From our base in Kozhikode, Kerala, we ship across India with care, clear communication, and
          customer support you can actually reach.
        </p>
      </Section>

      <Section title="What we stand for">
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong className="text-[#2a1210]">Design with purpose</strong> — silhouettes and prints chosen
            for how Indian women actually live and celebrate.
          </li>
          <li>
            <strong className="text-[#2a1210]">Honest quality</strong> — product details, sizes, and photos
            that match what arrives at your door.
          </li>
          <li>
            <strong className="text-[#2a1210]">Reliable delivery</strong> — partnered with trusted couriers
            such as Delhivery for trackable shipping.
          </li>
          <li>
            <strong className="text-[#2a1210]">Human support</strong> — email us at{' '}
            <a className="underline text-[#6b2f28]" href={`mailto:${SITE.email}`}>
              {SITE.email}
            </a>{' '}
            and we’ll help.
          </li>
        </ul>
      </Section>

      <Section title="Our promise">
        <p>
          Every order is packed with care from our workshop. If something isn’t right, our{' '}
          <Link href="/return-policy" className="underline text-[#6b2f28]">
            return policy
          </Link>{' '}
          and{' '}
          <Link href="/support" className="underline text-[#6b2f28]">
            support team
          </Link>{' '}
          are here to make it simple.
        </p>
      </Section>

      <Section title="Where to buy Nilaas">
        <p>
          Authentic Nilaas products are available only directly from Nilaas, through QuickFynd.com,
          and through Nilaas-authorized listings on Amazon. Purchases made through other sellers or
          marketplaces may not be eligible for Nilaas support.
        </p>
      </Section>

      <div className="grid sm:grid-cols-3 gap-4 pt-4">
        {[
          { href: '/shop', label: 'Shop collection' },
          { href: '/contact-us', label: 'Contact us' },
          { href: '/support', label: 'Get support' },
        ].map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="text-center border border-[#2a1210] px-4 py-3 text-sm font-semibold tracking-wide uppercase hover:bg-[#2a1210] hover:text-white transition-colors"
          >
            {c.label}
          </Link>
        ))}
      </div>
    </SitePage>
  )
}
