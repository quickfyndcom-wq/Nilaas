'use client'

import { addToCart, removeFromCart } from '@/lib/features/cart/cartSlice'
import { useDispatch, useSelector } from 'react-redux'

const Counter = ({ productId }) => {
  const { cartItems } = useSelector((state) => state.cart)
  const dispatch = useDispatch()

  return (
    <div className="inline-flex items-center border border-[#2a1210]/20">
      <button
        type="button"
        onClick={() => dispatch(removeFromCart({ productId }))}
        className="h-10 w-10 flex items-center justify-center text-[#2a1210] hover:bg-[#2a1210]/5 transition select-none"
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className="min-w-[2rem] text-center text-sm font-medium text-[#2a1210] tabular-nums">
        {cartItems[productId] || 0}
      </span>
      <button
        type="button"
        onClick={() => dispatch(addToCart({ productId }))}
        className="h-10 w-10 flex items-center justify-center text-[#2a1210] hover:bg-[#2a1210]/5 transition select-none"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  )
}

export default Counter
