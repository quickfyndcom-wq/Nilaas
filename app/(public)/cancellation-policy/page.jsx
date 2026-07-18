import Link from 'next/link'
import SitePage, { Section, PolicyMeta } from '@/components/SitePage'
import { SITE } from '@/lib/site'

export const metadata = {
  title: `Cancellation Policy · ${SITE.name}`,
  description: 'How to cancel a Nilaas order before it ships.',
}

export default function CancellationPolicyPage() {
  return (
    <SitePage title="Cancellation policy" subtitle="Cancel before we ship — simple and clear.">
      <PolicyMeta />

      <Section title="Customer cancellations">
        <p>
          You may request cancellation <strong>before the order is manifested / handed to the courier</strong>.
          Once an AWB is created or the package is in transit, cancellation may not be possible — use
          our Return Policy after delivery instead.
        </p>
        <p>
          Request via{' '}
          <Link href="/contact-us" className="underline text-[#6b2f28]">
            Contact us
          </Link>{' '}
          or email {SITE.email} with your Order ID.
        </p>
      </Section>

      <Section title="Our cancellations">
        <p>
          We may cancel if an item is unavailable, payment fails, address is undeliverable, or we
          detect fraud. Any amount paid will be refunded as per our Refund Policy.
        </p>
      </Section>

      <Section title="COD orders">
        <p>
          COD orders can usually be cancelled before pickup. Repeated COD refusals may lead to prepaid-only
          checkout for future orders.
        </p>
      </Section>
    </SitePage>
  )
}
