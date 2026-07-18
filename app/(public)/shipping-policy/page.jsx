import Link from 'next/link'
import SitePage, { Section, PolicyMeta } from '@/components/SitePage'
import { SITE } from '@/lib/site'

export const metadata = {
  title: `Shipping Policy · ${SITE.name}`,
  description: 'Nilaas shipping timelines, charges, and delivery partners.',
}

export default function ShippingPolicyPage() {
  return (
    <SitePage
      title="Shipping policy"
      subtitle="How we pack, ship, and deliver your Nilaas order across India."
    >
      <PolicyMeta />

      <Section title="Courier partner">
        <p>
          We primarily ship with <strong>Delhivery</strong> (and may use other partners if needed).
          Once manifested, you receive an AWB / tracking ID by email and can track on our{' '}
          <Link href="/track-order" className="underline text-[#6b2f28]">
            Track order
          </Link>{' '}
          page or the courier website.
        </p>
      </Section>

      <Section title="Processing time">
        <p>
          Orders are usually packed and handed to the courier within <strong>1–2 business days</strong>{' '}
          after confirmation (excluding Sundays and public holidays). COD and prepaid orders follow
          the same packing process.
        </p>
      </Section>

      <Section title="Delivery estimates">
        <p>
          Typical delivery after dispatch is <strong>1–5 business days</strong> depending on your
          pincode (metros often faster; remote areas may take longer). Estimates shown at checkout are
          indicative, not guarantees.
        </p>
      </Section>

      <Section title="Shipping charges">
        <p>
          Shipping fees (if any) are calculated at checkout based on your cart and destination. Free
          shipping may apply during promotions or above a minimum order value — details are shown
          before you pay.
        </p>
      </Section>

      <Section title="Address & failed delivery">
        <p>
          Please ensure your name, phone, and address are accurate. If delivery fails due to an
          incorrect address, unreachable phone, or refusal, the shipment may return to origin (RTO).
          Re-shipping may require additional charges.
        </p>
      </Section>

      <Section title="International shipping">
        <p>
          We currently ship within India only. For questions about future international options, email{' '}
          {SITE.email}.
        </p>
      </Section>

      <Section title="Need help?">
        <p>
          <Link href="/support" className="underline text-[#6b2f28]">
            Support
          </Link>{' '}
          ·{' '}
          <Link href="/contact-us" className="underline text-[#6b2f28]">
            Contact us
          </Link>
        </p>
      </Section>
    </SitePage>
  )
}
