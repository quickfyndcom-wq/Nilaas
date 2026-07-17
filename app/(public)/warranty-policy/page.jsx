import SitePage, { Section, PolicyMeta } from '@/components/SitePage'
import { SITE } from '@/lib/site'

export const metadata = {
  title: `Quality Promise · ${SITE.name}`,
  description: 'Nilaas quality promise for fashion apparel.',
}

export default function WarrantyPolicyPage() {
  return (
    <SitePage title="Quality promise" subtitle="Our commitment to product quality for apparel.">
      <PolicyMeta />
      <Section title="Apparel quality">
        <p>
          Nilaas fashion pieces are apparel, not electronics or jewellery with manufacturer warranties.
          We stand behind product quality at the time of delivery — manufacturing defects are covered
          under our Return Policy.
        </p>
      </Section>
      <Section title="Care">
        <p>
          Follow the care label on each garment. Damage from improper washing, bleaching, or alteration
          is not covered.
        </p>
      </Section>
      <Section title="Help">
        <p>
          Report defects within 48 hours of delivery with photos to {SITE.email}.
        </p>
      </Section>
    </SitePage>
  )
}
