import Link from 'next/link'
import SitePage, { Section } from '@/components/SitePage'
import { SITE } from '@/lib/site'

export const metadata = {
  title: `Support · ${SITE.name}`,
  description: 'Nilaas customer support — orders, shipping, returns, and FAQs.',
}

const CARDS = [
  {
    href: '/faq',
    title: 'FAQs',
    desc: 'Sizing, payments, delivery timelines, and common questions.',
  },
  {
    href: '/track-order',
    title: 'Track order',
    desc: 'Enter your Order ID or AWB to see live shipment status.',
  },
  {
    href: '/return-policy',
    title: 'Returns & exchanges',
    desc: 'Eligibility, timelines, and how to start a return request.',
  },
  {
    href: '/shipping-policy',
    title: 'Shipping info',
    desc: 'Delivery partners, charges, and estimated timelines.',
  },
  {
    href: '/orders',
    title: 'Your orders',
    desc: 'Sign in to view order history and invoices.',
  },
  {
    href: '/contact-us',
    title: 'Contact us',
    desc: 'Write to our team — we usually reply within 1 business day.',
  },
]

export default function SupportPage() {
  return (
    <SitePage
      title="Support"
      subtitle="We’re here to help with orders, delivery, returns, and product questions."
      wide
    >
      <Section title="How can we help?">
        <div className="grid sm:grid-cols-2 gap-4 not-prose">
          {CARDS.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="block border border-[#2a1210]/15 p-5 hover:border-[#2a1210] transition-colors"
            >
              <h3 className="font-serif text-xl text-[#2a1210] mb-1">{c.title}</h3>
              <p className="text-sm text-[#6e5048]">{c.desc}</p>
            </Link>
          ))}
        </div>
      </Section>

      <Section title="Direct contact">
        <p>
          Email{' '}
          <a href={`mailto:${SITE.email}`} className="underline text-[#6b2f28]">
            {SITE.email}
          </a>{' '}
          or call / WhatsApp{' '}
          <a href={`tel:${SITE.phoneTel}`} className="underline text-[#6b2f28]">
            {SITE.phone}
          </a>
          .
        </p>
        <p className="text-sm text-[#9a7d72]">Support hours: {SITE.hours}</p>
      </Section>
    </SitePage>
  )
}
