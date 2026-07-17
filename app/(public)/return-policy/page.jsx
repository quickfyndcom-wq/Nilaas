import Link from 'next/link'
import SitePage, { Section, PolicyMeta } from '@/components/SitePage'
import { SITE } from '@/lib/site'

export const metadata = {
  title: `Return Policy · ${SITE.name}`,
  description: 'Nilaas return and exchange policy for fashion apparel.',
}

export default function ReturnPolicyPage() {
  return (
    <SitePage
      title="Return & exchange policy"
      subtitle="Simple rules for returns and exchanges on eligible Nilaas products."
    >
      <PolicyMeta />

      <Section title="Window">
        <p>
          You may request a return or exchange within <strong>7 days</strong> of delivery for eligible
          items, unused and in original condition with tags and packaging.
        </p>
      </Section>

      <Section title="Eligible">
        <ul className="list-disc pl-5 space-y-1">
          <li>Wrong size / wrong item shipped</li>
          <li>Manufacturing defect or damage on arrival</li>
          <li>Significant colour/print mismatch vs listing (subject to review)</li>
        </ul>
      </Section>

      <Section title="Not eligible">
        <ul className="list-disc pl-5 space-y-1">
          <li>Used, washed, altered, or damaged by customer</li>
          <li>Items marked final sale / non-returnable</li>
          <li>Intimate apparel (if listed as non-returnable)</li>
          <li>Free gifts or promotional add-ons</li>
        </ul>
      </Section>

      <Section title="How to request">
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            Start a request via{' '}
            <Link href="/return-request" className="underline text-[#6b2f28]">
              Return request
            </Link>{' '}
            or email {SITE.email} with Order ID, photos, and reason.
          </li>
          <li>Our team reviews within 1–2 business days.</li>
          <li>If approved, we’ll share reverse-pickup or return instructions.</li>
          <li>After we receive and inspect the item, we’ll process exchange or refund.</li>
        </ol>
      </Section>

      <Section title="Refunds">
        <p>
          Approved refunds follow our{' '}
          <Link href="/refund-policy" className="underline text-[#6b2f28]">
            Refund policy
          </Link>
          . COD refunds may be issued via bank transfer or store credit as agreed.
        </p>
      </Section>
    </SitePage>
  )
}
