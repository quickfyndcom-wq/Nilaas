/**
 * Single public Order ID used everywhere:
 *   store UI · customer success page · emails · invoice · Delhivery `order` / `seller_inv`
 *
 * Value = shortOrderNumber (last 6 hex digits of Mongo _id as decimal).
 * Order ID and Order Number are the same string.
 */

export function computeShortOrderNumber(orderId) {
  if (!orderId) return null
  const hex = String(orderId).slice(-6)
  const n = parseInt(hex, 16)
  return Number.isFinite(n) ? n : null
}

/** Canonical Order ID / Order Number (identical). */
export function getPublicOrderNumber(order) {
  if (order?.shortOrderNumber != null && order.shortOrderNumber !== '') {
    return String(order.shortOrderNumber)
  }
  const computed = computeShortOrderNumber(order?._id || order?.id)
  return computed != null ? String(computed) : ''
}

/** Alias — Order ID === Order Number. */
export function getOrderId(order) {
  return getPublicOrderNumber(order)
}

/**
 * Value sent to Delhivery as `order` and `seller_inv`.
 * Must match the public Order ID exactly.
 */
export function getDelhiveryOrderRef(order) {
  const id = getPublicOrderNumber(order)
  if (id) return id
  const fallback = computeShortOrderNumber(order?._id)
  return fallback != null ? String(fallback) : String(order?._id || '')
}

/** Ensure order.shortOrderNumber is set (mutates mongoose doc / plain object). */
export function ensureShortOrderNumber(order) {
  if (!order) return null
  if (order.shortOrderNumber != null && order.shortOrderNumber !== '') {
    return Number(order.shortOrderNumber)
  }
  const n = computeShortOrderNumber(order._id || order.id)
  if (n != null) order.shortOrderNumber = n
  return n
}

// Re-export from shared status module (Delhivery-aligned ecommerce statuses)
export {
  ORDER_STATUSES,
  ORDER_STATUS_VALUES,
  mapDelhiveryStatusToOrder,
  extractDelhiveryStatus,
} from '@/lib/order-status'
