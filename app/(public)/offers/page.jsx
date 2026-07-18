import Link from 'next/link'
import SitePage, { Section } from '@/components/SitePage'
import { SITE } from '@/lib/site'

export const metadata = {
  title: `Offers · ${SITE.name}`,
  description: 'Current offers and promotions at Nilaas.',
}

export default function OffersPage() {
  return (
    <SitePage title="Offers & promotions" subtitle="Seasonal deals and coupon codes appear at checkout when available.">
      <Section title="How offers work">
        <p>
          Active promotions are shown on the shop and applied automatically or via coupon codes at
          checkout. Offer terms (minimum order, validity, exclusions) are displayed with each promotion.
        </p>
      </Section>
      <Section title="Shop now">
        <p>
          <Link href="/shop" className="underline text-[#6b2f28]">
            Browse the collection
          </Link>{' '}
          or email {SITE.email} if you have a coupon question.
        </p>
      </Section>
    </SitePage>
  )
}
