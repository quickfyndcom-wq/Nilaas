import SitePage, { Section, PolicyMeta } from '@/components/SitePage'
import { SITE } from '@/lib/site'

export const metadata = {
  title: `Disclaimer · ${SITE.name}`,
  description: 'Legal disclaimer for nilaas.in.',
}

export default function DisclaimerPage() {
  return (
    <SitePage title="Disclaimer" subtitle="Important information about using our website and products.">
      <PolicyMeta />

      <Section title="Website content">
        <p>
          Information on {SITE.url} is provided for general shopping and brand information. While we
          aim for accuracy, product details, availability, and pricing may change without notice.
        </p>
      </Section>

      <Section title="Product appearance">
        <p>
          Colours and textures may vary slightly from photos due to lighting and screen settings.
          Always check size charts and product descriptions before ordering.
        </p>
      </Section>

      <Section title="External links">
        <p>
          Our site may link to courier tracking or payment partners. We are not responsible for the
          content or privacy practices of third-party websites.
        </p>
      </Section>

      <Section title="No professional advice">
        <p>
          Nothing on this site constitutes legal, medical, or professional advice. For policy questions,
          contact {SITE.email}.
        </p>
      </Section>
    </SitePage>
  )
}
