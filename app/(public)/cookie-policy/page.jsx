import SitePage, { Section, PolicyMeta } from '@/components/SitePage'
import { SITE } from '@/lib/site'

export const metadata = {
  title: `Cookie Policy · ${SITE.name}`,
  description: 'How Nilaas uses cookies on nilaas.in.',
}

export default function CookiePolicyPage() {
  return (
    <SitePage title="Cookie policy" subtitle="How cookies help nilaas.in work smoothly.">
      <PolicyMeta />

      <Section title="What are cookies?">
        <p>
          Cookies are small files stored on your device. They help us keep you signed in, remember your
          cart, and understand how the site is used.
        </p>
      </Section>

      <Section title="Types we use">
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Essential</strong> — login, checkout, security
          </li>
          <li>
            <strong>Functional</strong> — preferences such as cart contents
          </li>
          <li>
            <strong>Analytics</strong> — aggregated traffic insights to improve the site
          </li>
          <li>
            <strong>Marketing</strong> — only if enabled (e.g. Meta Pixel), to measure campaigns
          </li>
        </ul>
      </Section>

      <Section title="Managing cookies">
        <p>
          You can block or delete cookies in your browser settings. Some features (cart, login) may not
          work correctly if essential cookies are disabled.
        </p>
      </Section>

      <Section title="Contact">
        <p>{SITE.email}</p>
      </Section>
    </SitePage>
  )
}
