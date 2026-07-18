import { redirect } from 'next/navigation'

/** Legacy gold-rate URL — redirect to shop (Nilaas is ladies fashion). */
export default function GoldRatePage() {
  redirect('/shop')
}
