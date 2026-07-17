/**
 * Default category tree for Nilaas (nilaas.in) — ladies fashion.
 */
export const NILAAS_FASHION_CATEGORIES = [
  {
    name: 'Ethnic Wear',
    description: 'Kurtis, sarees, lehengas and festive Indian outfits',
    children: [
      { name: 'Kurtis', description: 'Daily & festive kurtis' },
      { name: 'Sarees', description: 'Silk, georgette, cotton & party sarees' },
      { name: 'Lehengas', description: 'Bridal & festive lehengas' },
      { name: 'Salwar Suits', description: 'Ready-to-wear suits & sets' },
      { name: 'Anarkalis', description: 'Flowy anarkali dresses' },
    ],
  },
  {
    name: 'Western Wear',
    description: 'Modern everyday & party styles',
    children: [
      { name: 'Dresses', description: 'Casual, party & occasion dresses' },
      { name: 'Tops & Tunics', description: 'Tops, shirts and tunics' },
      { name: 'Jeans & Trousers', description: 'Denim, pants and trousers' },
      { name: 'Skirts', description: 'Mini, midi and maxi skirts' },
      { name: 'Jumpsuits & Playsuits', description: 'One-piece western looks' },
    ],
  },
  {
    name: 'Co-ords & Sets',
    description: 'Matching sets for effortless styling',
    children: [
      { name: 'Co-ord Sets', description: 'Top and bottom matching sets' },
      { name: 'Lounge Sets', description: 'Comfortable matching loungewear' },
    ],
  },
  {
    name: 'Loungewear',
    description: 'Soft home & sleep styles',
    children: [
      { name: 'Nightwear', description: 'Nightsuits and sleepwear' },
      { name: 'Lounge Tops', description: 'Relaxed tops for home' },
    ],
  },
  {
    name: 'Accessories',
    description: 'Finish every look',
    children: [
      { name: 'Bags', description: 'Handbags, clutches and totes' },
      { name: 'Fashion Jewelry', description: 'Earrings, necklaces and more' },
      { name: 'Scarves & Dupattas', description: 'Stoles, scarves and dupattas' },
    ],
  },
  {
    name: 'Footwear',
    description: 'Flats, heels and festive footwear',
    children: [
      { name: 'Flats', description: 'Everyday comfort flats' },
      { name: 'Heels', description: 'Block, kitten and party heels' },
      { name: 'Sandals', description: 'Casual and festive sandals' },
    ],
  },
  {
    name: 'Festive Wear',
    description: 'Wedding, party and celebration outfits',
    children: [],
  },
  {
    name: 'New Arrivals',
    description: 'Latest drops for women',
    children: [],
  },
  {
    name: 'Sale',
    description: 'Offers on ladies fashion',
    children: [],
  },
];

export function normalizeCategorySlug(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Flat quick-add chips for the admin UI */
export const NILAAS_QUICK_CATEGORIES = [
  'Kurtis',
  'Sarees',
  'Dresses',
  'Tops & Tunics',
  'Lehengas',
  'Co-ord Sets',
  'Jeans & Trousers',
  'Bags',
  'Fashion Jewelry',
  'New Arrivals',
  'Sale',
  'Festive Wear',
];
