/**
 * Ecommerce order statuses aligned with Delhivery shipment lifecycle.
 * Sellers can update any status manually; Sync from Delhivery maps courier scans.
 */

export const ORDER_STATUSES = [
  { value: 'ORDER_PLACED', label: 'Order Placed', group: 'store' },
  { value: 'CONFIRMED', label: 'Confirmed', group: 'store' },
  { value: 'PROCESSING', label: 'Processing', group: 'store' },
  { value: 'MANIFESTED', label: 'Manifested (AWB created)', group: 'delhivery' },
  { value: 'PICKUP_REQUESTED', label: 'Pickup Requested', group: 'delhivery' },
  { value: 'WAITING_FOR_PICKUP', label: 'Waiting for Pickup', group: 'delhivery' },
  { value: 'PICKED_UP', label: 'Picked Up', group: 'delhivery' },
  { value: 'WAREHOUSE_RECEIVED', label: 'At Warehouse', group: 'delhivery' },
  { value: 'SHIPPED', label: 'Shipped', group: 'delhivery' },
  { value: 'IN_TRANSIT', label: 'In Transit', group: 'delhivery' },
  { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', group: 'delhivery' },
  { value: 'UNDELIVERED', label: 'Undelivered / Pending', group: 'delhivery' },
  { value: 'DELIVERED', label: 'Delivered', group: 'delhivery' },
  { value: 'RETURN_REQUESTED', label: 'Return Requested', group: 'return' },
  { value: 'RETURNED', label: 'Returned', group: 'return' },
  { value: 'RTO', label: 'RTO (Return to Origin)', group: 'return' },
  { value: 'CANCELLED', label: 'Cancelled', group: 'store' },
]

export const ORDER_STATUS_VALUES = ORDER_STATUSES.map((s) => s.value)

/**
 * Map Delhivery tracking / scan status text → our order status.
 */
export function mapDelhiveryStatusToOrder(rawStatus = '') {
  const s = String(rawStatus || '')
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .trim()

  if (!s) return null

  if (/(cancel|cancelled|canceled)/.test(s)) return 'CANCELLED'
  if (/\brto\b|return to origin|rto delivered|dto/.test(s)) return 'RTO'
  if (/returned|return delivered|reverse/.test(s) && !/request/.test(s)) return 'RETURNED'
  if (/delivered|delivery complete|consignee received/.test(s)) return 'DELIVERED'
  if (/out for delivery|\bofd\b|with delivery executive|dispatched for delivery/.test(s)) {
    return 'OUT_FOR_DELIVERY'
  }
  if (/undelivered|pending|not delivered|failed delivery|customer not available|door closed/.test(s)) {
    return 'UNDELIVERED'
  }
  if (/in transit|in-transit|transit|reached|left|departed|hub|bagged|connected/.test(s)) {
    return 'IN_TRANSIT'
  }
  if (/warehouse|received at|arrived at facility|ud/.test(s) && /receiv|warehouse|facility/.test(s)) {
    return 'WAREHOUSE_RECEIVED'
  }
  if (/picked up|pickup done|collected|shipment picked/.test(s)) return 'PICKED_UP'
  if (/not picked|awaiting pickup|pickup scheduled|pickup pending|scheduled/.test(s)) {
    return 'WAITING_FOR_PICKUP'
  }
  if (/pickup request|fm assigned/.test(s)) return 'PICKUP_REQUESTED'
  if (/manifest|open|shipment created|booked|assigned/.test(s)) return 'MANIFESTED'
  if (/shipped|dispatched/.test(s)) return 'SHIPPED'

  return null
}

/** Get Shipment object from Delhivery track API JSON. */
export function getDelhiveryShipment(trackData) {
  return (
    trackData?.ShipmentData?.[0]?.Shipment ||
    trackData?.shipment_data?.[0]?.Shipment ||
    trackData?.ShipmentData?.[0] ||
    trackData?.packages?.[0] ||
    null
  )
}

/** Pull latest status string from Delhivery track API JSON. */
export function extractDelhiveryStatus(trackData) {
  const details = extractDelhiveryTrackingDetails(trackData)
  return details?.status || null
}

/**
 * Normalize Delhivery track response for the website UI.
 * @returns {{ status, statusType, statusDate, location, estimatedDelivery, origin, destination, scans, mappedStatus } | null}
 */
export function extractDelhiveryTrackingDetails(trackData) {
  const shipment = getDelhiveryShipment(trackData)
  if (!shipment && !trackData) return null

  const statusObj = shipment?.Status || shipment?.status || {}
  const rawScans = shipment?.Scans || shipment?.scans || []

  const scans = (Array.isArray(rawScans) ? rawScans : [])
    .map((s) => {
      const d = s?.ScanDetail || s || {}
      const statusText =
        d.Scan ||
        d.Instructions ||
        d.StatusCode ||
        d.status ||
        d.ScanType ||
        ''
      const when =
        d.StatusDateTime ||
        d.ScanDateTime ||
        d.StatusDate ||
        d.date ||
        d.ScanDate ||
        null
      const location =
        d.ScannedLocation ||
        d.Location ||
        d.City ||
        d.location ||
        ''
      return {
        status: String(statusText || '').trim(),
        location: String(location || '').trim(),
        at: when ? new Date(when).toISOString() : null,
        type: String(d.ScanType || d.StatusType || '').trim(),
      }
    })
    .filter((s) => s.status)
    .sort((a, b) => {
      const ta = a.at ? new Date(a.at).getTime() : 0
      const tb = b.at ? new Date(b.at).getTime() : 0
      return tb - ta // newest first
    })

  const latest = scans[0]
  const status =
    String(
      latest?.status ||
        statusObj.Status ||
        statusObj.StatusType ||
        statusObj.Instructions ||
        shipment?.status ||
        trackData?.status ||
        ''
    ).trim() || null

  if (!status && scans.length === 0) return null

  const statusDate =
    statusObj.StatusDateTime ||
    statusObj.StatusDate ||
    latest?.at ||
    null

  return {
    status,
    statusType: String(statusObj.StatusType || statusObj.statusType || latest?.type || '').trim(),
    statusDate: statusDate ? new Date(statusDate).toISOString() : null,
    location: String(
      latest?.location ||
        statusObj.StatusLocation ||
        shipment?.Destination ||
        ''
    ).trim(),
    estimatedDelivery:
      shipment?.ExpectedDeliveryDate ||
      shipment?.PromisedDeliveryDate ||
      shipment?.edd ||
      null,
    origin: String(shipment?.Origin || shipment?.PickUpDate || '').trim(),
    destination: String(
      shipment?.Destination ||
        [shipment?.Consignee?.City, shipment?.Consignee?.State].filter(Boolean).join(', ')
    ).trim(),
    scans,
    mappedStatus: mapDelhiveryStatusToOrder(status),
    waybill: String(shipment?.AWB || shipment?.Waybill || shipment?.wbn || '').trim() || null,
  }
}
