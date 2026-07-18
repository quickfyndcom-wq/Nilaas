import SitePage, { Section } from '@/components/SitePage'
import { SITE } from '@/lib/site'

export const metadata = {
  title: `Payment Options · ${SITE.name}`,
  description: 'Accepted payment methods at Nilaas.',
}

export default function PaymentOptionsPage() {
  return (
    <SitePage title="Payment options" subtitle="Secure ways to pay for your Nilaas order.">
      <Section title="Accepted methods">
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>UPI, cards & net banking</strong> — via Razorpay (prepaid)
          </li>
          <li>
            <strong>Cash on Delivery (COD)</strong> — where available for your pincode
          </li>
        </ul>
      </Section>
      <Section title="Security">
        <p>
          Card and UPI details are processed by our payment partner. {SITE.name} does not store full
          card numbers on our servers.
        </p>
      </Section>
      <Section title="Issues">
        <p>
          If a payment fails or is deducted twice, email {SITE.email} with the Order ID and payment
          reference.
        </p>
      </Section>
    </SitePage>
  )
}
