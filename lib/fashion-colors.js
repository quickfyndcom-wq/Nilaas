/** Shared fashion color names → CSS swatch values for admin + storefront */

export const FASHION_COLOR_HEX = {
  Black: '#1a1a1a',
  White: '#f7f5f2',
  Ivory: '#fffff0',
  Beige: '#d9c4a8',
  Cream: '#f0e6d8',
  Pink: '#ec4899',
  Rose: '#e11d48',
  Red: '#dc2626',
  Maroon: '#7f1d1d',
  Burgundy: '#6b0f1a',
  Orange: '#ea580c',
  Mustard: '#c4a035',
  Yellow: '#eab308',
  Green: '#16a34a',
  Olive: '#6b7c3a',
  Teal: '#0d9488',
  Blue: '#2563eb',
  Navy: '#1e3a5f',
  Purple: '#7c3aed',
  Lavender: '#a78bfa',
  Grey: '#6b7280',
  Gray: '#6b7280',
  Brown: '#6b4423',
  Gold: '#c9a84c',
  Silver: '#c0c0c0',
  Multicolor: 'linear-gradient(135deg,#f472b6 0%,#fbbf24 35%,#34d399 65%,#60a5fa 100%)',
}

/** Case-insensitive / partial match helpers */
const LOOKUP = Object.entries(FASHION_COLOR_HEX).map(([name, value]) => ({
  key: name.toLowerCase(),
  name,
  value,
}))

export function colorToSwatch(name) {
  if (!name) return '#d4c4b8'
  const key = String(name).trim().toLowerCase()
  const exact = LOOKUP.find((c) => c.key === key)
  if (exact) return exact.value
  const partial = LOOKUP.find((c) => key.includes(c.key) || c.key.includes(key))
  if (partial) return partial.value
  return '#c4b5a8'
}

export function isLightSwatch(name) {
  const swatch = colorToSwatch(name)
  if (String(swatch).startsWith('linear')) return false
  const hex = String(swatch).replace('#', '')
  if (hex.length !== 6) return false
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  // Perceived brightness
  return (r * 299 + g * 587 + b * 114) / 1000 > 200
}

export const FASHION_COLOR_OPTIONS = Object.keys(FASHION_COLOR_HEX).filter((n) => n !== 'Gray')
