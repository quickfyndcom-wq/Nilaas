import SitePage, { Section } from '@/components/SitePage'
import { SITE } from '@/lib/site'

export const metadata = {
  title: `International Shipping · ${SITE.name}`,
  description: 'Nilaas currently ships within India only.',
}

export default function InternationalShippingPage() {
  return (
    <SitePage
      title="International shipping"
      subtitle="Where we deliver today — and what’s coming next."
    >
      <Section title="India only (for now)">
        <p>
          Nilaas currently ships to serviceable pincodes across <strong>India</strong> only. We do not
          offer international checkout at this time.
        </p>
        <p>
          If you are abroad and need a gift delivered within India, place the order with an Indian
          shipping address and working phone number for the courier.
        </p>
      </Section>
      <Section title="Questions">
        <p>
          Email{' '}
          <a href={`mailto:${SITE.email}`} className="underline text-[#6b2f28]">
            {SITE.email}
          </a>{' '}
          and we’ll help if we can.
        </p>
      </Section>
    </SitePage>
  )
}
