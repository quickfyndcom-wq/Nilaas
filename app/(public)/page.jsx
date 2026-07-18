'use client'

import Hero from '@/components/Hero'
import HomeWelcomeStrip from '@/components/HomeWelcomeStrip'
import HomeProductGrid from '@/components/HomeProductGrid'
import AuspiciousProductsCarousel from '@/components/AuspiciousProductsCarousel'
import ShopByCategory from '@/components/ShopByCategory'
import HomeFeaturedMoment from '@/components/HomeFeaturedMoment'
import PromotionBanner from '@/components/PromotionBanner'
import TanishqExperience from '@/components/TanishqExperience'

/**
 * Homepage flow (top → bottom):
 * 1. Hero campaign
 * 2. Quick categories
 * 3. Product grid (shop early)
 * 4. Featured product edit rail
 * 5. Full category browse
 * 6. Store visit moment
 * 7. Gift / promo split
 * 8. Closing utility tiles
 */
export default function Home() {
  return (
    <>
      <Hero />

      <HomeWelcomeStrip />

      <HomeProductGrid
        title="Shop the collection"
        subtitle="Dresses, kurtis & co-ords ready to wear"
        limit={8}
        viewAllHref="/shop"
      />

      <AuspiciousProductsCarousel />

      <ShopByCategory />

      <HomeFeaturedMoment />

      <PromotionBanner />

      <TanishqExperience />
    </>
  )
}
