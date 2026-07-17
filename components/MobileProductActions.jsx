'use client'

import { ShoppingBag, Zap } from 'lucide-react'

export default function MobileProductActions({
  onOrderNow,
  onAddToCart,
  cartCount,
  disabled = false,
}) {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 safe-area-bottom border-t border-[#2a1210]/10 bg-white/95 backdrop-blur-md">
      <div className="flex items-center gap-2.5 px-4 py-3">
        <button
          type="button"
          onClick={onAddToCart}
          disabled={disabled}
          className="relative flex items-center justify-center w-14 h-12 border border-[#2a1210] text-[#2a1210] transition active:bg-[#2a1210] active:text-[#faf7f4] disabled:opacity-40"
          aria-label="Add to bag"
        >
          <ShoppingBag size={20} strokeWidth={1.75} />
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-[#6b2f28] text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={onOrderNow}
          disabled={disabled}
          className="flex-1 flex items-center justify-center gap-2 h-12 bg-[#2a1210] text-[#faf7f4] text-sm font-semibold tracking-wide transition active:bg-[#4a221c] disabled:opacity-40"
        >
          <Zap size={16} strokeWidth={2} />
          Buy now
        </button>
      </div>
    </div>
  )
}
