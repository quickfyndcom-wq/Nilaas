import SitePage, { Section, PolicyMeta } from '@/components/SitePage'
import { SITE } from '@/lib/site'

export const metadata = {
  title: `Terms & Conditions · ${SITE.name}`,
  description: 'Terms and conditions for shopping on Nilaas.',
}

export default function TermsPage() {
  return (
    <SitePage
      title="Terms & conditions"
      subtitle="Please read these terms carefully before using nilaas.in or placing an order."
    >
      <PolicyMeta />

      <Section title="1. Acceptance">
        <p>
          By accessing {SITE.url} or purchasing from {SITE.name}, you agree to these Terms & Conditions
          and our Privacy, Shipping, and Return policies. If you do not agree, please do not use our
          website.
        </p>
      </Section>

      <Section title="2. Who we are">
        <p>
          {SITE.name} operates an online store for ladies’ fashion apparel in India. Contact:{' '}
          {SITE.email}. Address: {SITE.address}.
        </p>
      </Section>

      <Section title="3. Products & pricing">
        <p>
          Product colours, sizes, and fabrics are described as accurately as possible. Minor variations
          may occur due to photography, screen settings, or manufacturing batches. All prices are in
          Indian Rupees (INR) unless stated otherwise and include applicable taxes as shown at
          checkout. We may update prices or correct errors without prior notice.
        </p>
      </Section>

      <Section title="4. Orders">
        <p>
          An order is an offer to buy. We may accept or decline an order (for example, stock issues,
          payment failure, or suspected fraud). You will receive an order confirmation email with your
          Order ID. Order status updates may also be sent by email.
        </p>
      </Section>

      <Section title="5. Payment">
        <p>
          We accept Cash on Delivery (where available) and online payments via Razorpay or other
          gateways shown at checkout. You are responsible for providing accurate payment details.
          Online payments are processed securely by our payment partners.
        </p>
      </Section>

      <Section title="6. Shipping & delivery">
        <p>
          Delivery is handled through courier partners such as Delhivery. Estimated timelines are
          indicative. Risk of loss passes to you upon delivery to the address provided. Please ensure
          phone and address details are correct. See our Shipping Policy for details.
        </p>
      </Section>

      <Section title="7. Returns, refunds & cancellations">
        <p>
          Returns, exchanges, refunds, and cancellations are governed by our Return, Refund, and
          Cancellation policies published on this website. Certain items may be non-returnable if
          marked as such.
        </p>
      </Section>

      <Section title="8. User accounts">
        <p>
          You are responsible for keeping login credentials confidential and for activity under your
          account. Provide accurate information and update it when it changes.
        </p>
      </Section>

      <Section title="9. Intellectual property">
        <p>
          All content on this site — logos, images, text, and design — belongs to {SITE.name} or its
          licensors. You may not copy, resell, or commercially exploit our content without written
          permission.
        </p>
      </Section>

      <Section title="10. Limitation of liability">
        <p>
          To the fullest extent permitted by law, {SITE.name} is not liable for indirect, incidental,
          or consequential damages arising from use of the site or products, except where required by
          applicable consumer protection law in India.
        </p>
      </Section>

      <Section title="11. Governing law">
        <p>
          These terms are governed by the laws of India. Courts in Kozhikode, Kerala shall have
          exclusive jurisdiction, subject to mandatory consumer forum rights.
        </p>
      </Section>

      <Section title="12. Changes">
        <p>
          We may update these terms from time to time. The “Last updated” date at the top of this page
          reflects the latest revision. Continued use of the site constitutes acceptance of the updated
          terms.
        </p>
      </Section>
    </SitePage>
  )
}
