import SitePage, { Section, PolicyMeta } from '@/components/SitePage'
import { SITE } from '@/lib/site'

export const metadata = {
  title: `Privacy Policy · ${SITE.name}`,
  description: 'How Nilaas collects, uses, and protects your personal information.',
}

export default function PrivacyPage() {
  return (
    <SitePage
      title="Privacy policy"
      subtitle="How we collect, use, and protect your information when you shop with Nilaas."
    >
      <PolicyMeta />

      <Section title="1. Information we collect">
        <p>We may collect:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Name, email, phone, and shipping address</li>
          <li>Order history, payment method type (not full card details)</li>
          <li>Account login identifiers (e.g. Firebase Auth)</li>
          <li>Device/browser data and cookies for site performance</li>
          <li>Messages you send via contact or support forms</li>
        </ul>
      </Section>

      <Section title="2. How we use information">
        <ul className="list-disc pl-5 space-y-1">
          <li>Process and deliver orders (including sharing address/phone with couriers such as Delhivery)</li>
          <li>Send order confirmations, shipping updates, and service emails</li>
          <li>Provide customer support and handle returns/refunds</li>
          <li>Improve our website, products, and fraud prevention</li>
          <li>Comply with legal and tax obligations</li>
        </ul>
      </Section>

      <Section title="3. Sharing">
        <p>
          We do not sell your personal data. We share data only with trusted processors as needed:
          payment gateways (e.g. Razorpay), courier partners, email/SMS providers, hosting/cloud
          services, and authorities when legally required.
        </p>
      </Section>

      <Section title="4. Cookies">
        <p>
          We use cookies and similar technologies for login sessions, cart preference, analytics, and
          site functionality. See our Cookie Policy for more detail. You can control cookies via your
          browser settings.
        </p>
      </Section>

      <Section title="5. Data security & retention">
        <p>
          We use reasonable technical and organisational measures to protect your data. We retain
          order and account records as required for business, tax, and legal purposes, then delete or
          anonymise when no longer needed.
        </p>
      </Section>

      <Section title="6. Your rights">
        <p>
          Subject to applicable law, you may request access, correction, or deletion of your personal
          data, or withdraw marketing consent. Contact{' '}
          <a href={`mailto:${SITE.email}`} className="underline text-[#6b2f28]">
            {SITE.email}
          </a>
          .
        </p>
      </Section>

      <Section title="7. Children">
        <p>
          Our store is not directed at children under 18. We do not knowingly collect personal data
          from minors.
        </p>
      </Section>

      <Section title="8. Contact">
        <p>
          Privacy questions: {SITE.email}
          <br />
          {SITE.address}
        </p>
      </Section>
    </SitePage>
  )
}
