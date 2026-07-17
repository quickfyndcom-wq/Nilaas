'use client'

import { ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function CartSummaryBox({ subtotal, shipping, total }) {
  const router = useRouter()

  return (
    <div className="border border-[#2a1210]/10 bg-white p-6 sm:p-7 w-full">
      <p className="text-[11px] tracking-[0.28em] uppercase text-[#8a5a4a] mb-2">Order summary</p>
      <h2 className="font-serif text-2xl text-[#2a1210] mb-6">Your bag</h2>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between text-[#6e5048]">
          <span>Subtotal</span>
          <span className="tabular-nums text-[#2a1210]">₹{Number(subtotal || 0).toLocaleString('en-IN')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#6e5048]">Shipping &amp; handling</span>
          <span
            className={`tabular-nums font-medium ${
              shipping === 0 ? 'text-[#2a1210]' : 'text-[#2a1210]'
            }`}
          >
            {shipping === 0 ? 'FREE' : `₹${Number(shipping).toLocaleString('en-IN')}`}
          </span>
        </div>
        <div className="border-t border-[#2a1210]/10 pt-4 mt-2 flex justify-between items-baseline">
          <span className="font-serif text-xl text-[#2a1210]">Total</span>
          <span className="text-lg font-semibold text-[#2a1210] tabular-nums">
            ₹{Number(total || 0).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      <div className="mt-7 space-y-3">
        <button
          type="button"
          className="w-full h-13 min-h-[52px] px-6 bg-[#2a1210] text-[#faf7f4] text-sm font-semibold tracking-wide hover:bg-[#4a221c] transition inline-flex items-center justify-center gap-2"
          onClick={() => router.push('/checkout')}
        >
          Checkout
          <ArrowRight size={16} />
        </button>
        <button
          type="button"
          className="w-full h-13 min-h-[52px] px-6 border border-[#2a1210] text-[#2a1210] text-sm font-semibold tracking-wide hover:bg-[#2a1210] hover:text-[#faf7f4] transition"
          onClick={() => router.push('/shop')}
        >
          Continue shopping
        </button>
      </div>

      <p className="mt-5 text-xs text-[#9a7d72] leading-relaxed text-center">
        Secure checkout · Free returns on eligible orders
      </p>
    </div>
  )
}
