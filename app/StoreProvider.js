'use client'

/**
 * Cart rehydration lives in ReduxProvider (single store).
 * Kept as a passthrough so existing imports keep working.
 */
export default function StoreProvider({ children }) {
  return children
}
