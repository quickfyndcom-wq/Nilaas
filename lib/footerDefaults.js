/** Default footer sections — editable later in Store → Menu Management → Footer Menu */

export const DEFAULT_FOOTER_SECTIONS = [
  {
    title: 'Shop',
    links: [
      { name: 'New Arrivals', link: '/shop?category=new-arrivals' },
      { name: 'Dresses', link: '/shop?category=dresses' },
      { name: 'Kurtis', link: '/shop?category=kurtis' },
      { name: 'Ethnic Wear', link: '/shop?category=ethnic-wear' },
      { name: 'Sale', link: '/shop?category=sale' },
      { name: 'Find store', link: '/find-store' },
    ],
  },
  {
    title: 'Categories',
    links: [
      { name: 'Western Wear', link: '/shop?category=western-wear' },
      { name: 'Loungewear', link: '/shop?category=loungewear' },
      { name: 'Festive', link: '/shop?category=festive-wear' },
      { name: 'All products', link: '/shop' },
      { name: 'Wishlist', link: '/wishlist' },
      { name: 'Offers', link: '/offers' },
    ],
  },
  {
    title: 'Policies',
    links: [
      { name: 'Shipping policy', link: '/shipping-policy' },
      { name: 'Returns & exchanges', link: '/return-policy' },
      { name: 'Refund policy', link: '/refund-policy' },
      { name: 'Cancellation', link: '/cancellation-policy' },
      { name: 'Privacy policy', link: '/privacy' },
      { name: 'Terms & conditions', link: '/terms' },
      { name: 'Cookie policy', link: '/cookie-policy' },
      { name: 'Disclaimer', link: '/disclaimer' },
    ],
  },
  {
    title: 'Company',
    links: [
      { name: 'About Nilaas', link: '/about-us' },
      { name: 'Contact us', link: '/contact-us' },
      { name: 'Help & FAQs', link: '/faq' },
      { name: 'Support', link: '/support' },
      { name: 'Blog', link: '/blog' },
      { name: 'Track order', link: '/track-order' },
    ],
  },
]
