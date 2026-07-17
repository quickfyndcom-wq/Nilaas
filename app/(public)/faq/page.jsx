import Link from 'next/link'
import SitePage, { Section } from '@/components/SitePage'
import { SITE } from '@/lib/site'

export const metadata = {
  title: `FAQs · ${SITE.name}`,
  description: 'Frequently asked questions about shopping at Nilaas.',
}

const FAQS = [
  {
    q: 'How do I track my order?',
    a: 'Use Track order with your Order ID or Delhivery AWB. You also receive tracking by email when the shipment is manifested.',
  },
  {
    q: 'How long does delivery take?',
    a: 'We usually pack within 1–2 business days. Courier delivery is typically 1–5 business days depending on your pincode.',
  },
  {
    q: 'Do you offer Cash on Delivery?',
    a: 'Yes, COD is available on eligible pincodes and order values shown at checkout.',
  },
  {
    q: 'How do returns work?',
    a: 'Eligible unused items can be returned within 7 days of delivery. Start via Return request or email support.',
  },
  {
    q: 'What is my Order ID?',
    a: 'Your Order ID is the short number shown on the order success page and in confirmation emails — the same reference we use with Delhivery.',
  },
  {
    q: 'How can I contact support?',
    a: `Email ${SITE.email} or call/WhatsApp ${SITE.phone}. Hours: ${SITE.hours}.`,
  },
]

export default function FaqPage() {
  return (
    <SitePage title="Help & FAQs" subtitle="Quick answers for shopping, shipping, and returns." wide>
      <div className="space-y-4">
        {FAQS.map((item) => (
          <Section key={item.q} title={item.q}>
            <p>{item.a}</p>
          </Section>
        ))}
      </div>
      <p className="pt-4 text-sm">
        Still need help?{' '}
        <Link href="/contact-us" className="underline text-[#6b2f28]">
          Contact us
        </Link>{' '}
        or visit{' '}
        <Link href="/support" className="underline text-[#6b2f28]">
          Support
        </Link>
        .
      </p>
    </SitePage>
  )
}
