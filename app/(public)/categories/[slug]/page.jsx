import { redirect } from 'next/navigation'

/** Prefer singular /category/[slug] */
export default async function CategoriesSlugRedirect({ params }) {
  const resolved = await params
  const slug = Array.isArray(resolved?.slug) ? resolved.slug[0] : resolved?.slug
  redirect(`/category/${encodeURIComponent(slug || '')}`)
}
