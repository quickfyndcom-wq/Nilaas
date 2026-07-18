/** Shared Nilaas company / contact constants for public pages */

export const SITE = {
  name: 'Nilaas',
  tagline: 'Indian fashion, made to wear',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://nilaas.in',
  email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@nilaas.in',
  phone: process.env.NEXT_PUBLIC_SUPPORT_PHONE || '+91 75928 00864',
  phoneTel: process.env.NEXT_PUBLIC_SUPPORT_PHONE_TEL || '+917592800864',
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || '917592800864',
  address:
    process.env.NEXT_PUBLIC_BUSINESS_ADDRESS ||
    'Nilaas, MLA Road near Police Station, Ambalamukku, Kunnamangalam, Kozhikode, Kerala 673571, India',
  hours: 'Mon–Sat, 10:00 AM – 6:00 PM IST',
  brand: '#2a1210',
  brandSoft: '#6b2f28',
  muted: '#9a7d72',
}
