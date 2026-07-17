import Link from 'next/link'
import SitePage, { Section, PolicyMeta } from '@/components/SitePage'
import { SITE } from '@/lib/site'

export const metadata = {
  title: `Refund Policy · ${SITE.name}`,
  description: 'How Nilaas processes refunds for cancelled or returned orders.',
}

export default function RefundPolicyPage() {
  return (
    <SitePage title="Refund policy" subtitle="When and how refunds are issued for Nilaas orders.">
      <PolicyMeta />

      <Section title="When refunds apply">
        <ul className="list-disc pl-5 space-y-1">
          <li>Approved returns under our Return Policy</li>
          <li>Cancelled orders before dispatch (where payment was collected)</li>
          <li>Orders we cannot fulfil (out of stock after payment)</li>
          <li>Duplicate or failed payment captures (after verification)</li>
        </ul>
      </Section>

      <Section title="Timelines">
        <p>
          After approval and (for returns) receipt of the product, refunds are usually initiated within{' '}
          <strong>5–7 business days</strong>. Banks/UPI may take additional 3–7 business days to
          reflect the credit.
        </p>
      </Section>

      <Section title="Methods">
        <p>
          Prepaid orders are refunded to the original payment method when possible. COD refunds may
          be issued via UPI/bank transfer after you share verified account details, or as store credit
          if you prefer.
        </p>
      </Section>

      <Section title="Shipping fees">
        <p>
          Original shipping fees are refundable only if the return is due to our error (wrong/defective
          item). Customer-initiated size exchanges may not include free return shipping.
        </p>
      </Section>

      <Section title="Questions">
        <p>
          Email {SITE.email} with your Order ID. Also see{' '}
          <Link href="/return-policy" className="underline text-[#6b2f28]">
            Returns
          </Link>{' '}
          and{' '}
          <Link href="/cancellation-policy" className="underline text-[#6b2f28]">
            Cancellation
          </Link>
          .
        </p>
      </Section>
    </SitePage>
  )
}
