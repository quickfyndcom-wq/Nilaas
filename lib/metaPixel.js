/** Nilaas Meta Pixel — only this ID is allowed on the site */
export const META_PIXEL_ID = '1070471465441932'

export function trackMeta(event, data) {
  if (typeof window === 'undefined') return
  try {
    if (typeof window.fbq === 'function') {
      if (data && typeof data === 'object') {
        window.fbq('track', event, data)
      } else {
        window.fbq('track', event)
      }
    }
  } catch (err) {
    console.warn('Meta Pixel track failed:', err)
  }
}
