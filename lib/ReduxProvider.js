'use client'

import { useEffect, useRef } from 'react'
import { Provider } from 'react-redux'
import { makeStore } from './store'
import { rehydrateCart } from './features/cart/cartSlice'

export default function ReduxProvider({ children }) {
  const storeRef = useRef(undefined)
  if (!storeRef.current) {
    storeRef.current = makeStore()
  }

  useEffect(() => {
    storeRef.current.dispatch(rehydrateCart())
  }, [])

  return <Provider store={storeRef.current}>{children}</Provider>
}
