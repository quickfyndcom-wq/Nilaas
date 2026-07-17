import axios from 'axios'
import { ensureShortOrderNumber, getDelhiveryOrderRef } from '@/lib/orderNumber'

function getConfig() {
  const token = process.env.DELHIVERY_API_TOKEN
  const staging = String(process.env.DELHIVERY_STAGING || '').toLowerCase() === 'true'
  const base = staging
    ? 'https://staging-express.delhivery.com'
    : 'https://track.delhivery.com'
  return {
    token,
    base,
    pickupName: process.env.DELHIVERY_PICKUP_NAME || 'Nilaas',
    clientName: process.env.DELHIVERY_CLIENT_NAME || '',
  }
}

function authHeaders() {
  const { token } = getConfig()
  if (!token) throw new Error('DELHIVERY_API_TOKEN is not configured')
  return {
    Authorization: `Token ${token}`,
    Accept: 'application/json',
  }
}

function sanitize(str = '') {
  return String(str || '')
    .replace(/[&#%;\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function checkPincodeServiceability(pincode) {
  const { base } = getConfig()
  const url = `${base}/c/api/pin-codes/json/?filter_codes=${encodeURIComponent(pincode)}`
  const { data } = await axios.get(url, { headers: authHeaders() })
  return data
}

export async function getExpectedTAT(origin, destination, mot = 'S', pdt = 'B2C', expected_pickup_date = '') {
  const { base } = getConfig()
  let url = `${base}/api/dc/expected_tat?origin_pin=${origin}&destination_pin=${destination}&mot=${mot}&pdt=${pdt}`
  if (expected_pickup_date) url += `&expected_pickup_date=${expected_pickup_date}`
  const { data } = await axios.get(url, { headers: authHeaders() })
  return data
}

export async function trackWaybill(waybill) {
  const { base } = getConfig()
  const url = `${base}/api/v1/packages/json/?waybill=${encodeURIComponent(waybill)}`
  const { data } = await axios.get(url, { headers: authHeaders() })
  return data
}

/**
 * Create / manifest a forward shipment on Delhivery Express.
 * @returns {{ waybill, raw, success, message }}
 */
export async function createShipment({ order, pickupName }) {
  const { base, pickupName: defaultPickup, clientName } = getConfig()
  const address = order.shippingAddress || {}
  const pin = address.zip || address.pincode || address.pin
  const phone = String(address.phone || order.guestPhone || '').replace(/\D/g, '').slice(-10)
  const name = sanitize(address.name || order.guestName || 'Customer')
  const street = sanitize(address.street || address.address || '')
  const city = sanitize(address.city || '')
  const state = sanitize(address.state || '')

  if (!pin || !phone || !street) {
    throw new Error('Order is missing required shipping pin, phone or address')
  }

  const paymentMode =
    String(order.paymentMethod || '').toUpperCase() === 'COD' ? 'COD' : 'Prepaid'

  const products = (order.orderItems || [])
    .map((i) => i.name || i.productId?.name || 'Item')
    .join(', ')
    .slice(0, 200)

  const qty = (order.orderItems || []).reduce((s, i) => s + (Number(i.quantity) || 1), 0) || 1
  const total = Number(order.total) || 0
  const codAmount = paymentMode === 'COD' ? total : 0
  // Same Order ID as store UI / customer / emails
  ensureShortOrderNumber(order)
  const orderRef = getDelhiveryOrderRef(order)

  const payload = {
    shipments: [
      {
        name,
        add: street,
        pin: String(pin),
        city,
        state,
        country: sanitize(address.country || 'India') || 'India',
        phone,
        order: orderRef,
        payment_mode: paymentMode,
        products_desc: sanitize(products) || 'Apparel',
        hsn_code: process.env.DELHIVERY_DEFAULT_HSN || '6109',
        cod_amount: String(codAmount),
        total_amount: String(total),
        quantity: String(qty),
        weight: String(process.env.DELHIVERY_DEFAULT_WEIGHT_GM || '500'),
        shipment_width: String(process.env.DELHIVERY_DEFAULT_WIDTH || '10'),
        shipment_height: String(process.env.DELHIVERY_DEFAULT_HEIGHT || '10'),
        shipping_mode: process.env.DELHIVERY_SHIPPING_MODE || 'Surface',
        seller_name: sanitize(process.env.DELHIVERY_SELLER_NAME || 'Nilaas'),
        seller_add: sanitize(process.env.DELHIVERY_SELLER_ADDRESS || ''),
        seller_gst_tin: process.env.DELHIVERY_SELLER_GSTIN || '',
        seller_inv: orderRef,
        ...(clientName ? { client: clientName } : {}),
      },
    ],
    pickup_location: {
      name: pickupName || defaultPickup,
    },
  }

  const body = `format=json&data=${encodeURIComponent(JSON.stringify(payload))}`
  const url = `${base}/api/cmu/create.json`

  const { data } = await axios.post(url, body, {
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })

  // Response shapes vary: { success, packages: [{ waybill }], remark } or nested
  const packages = data?.packages || data?.shipment_data || []
  const first = Array.isArray(packages) ? packages[0] : null
  const waybill =
    first?.waybill ||
    first?.wbn ||
    data?.waybill ||
    data?.cash_pickups_count?.waybill ||
    null

  const success =
    data?.success === true ||
    data?.success === 'true' ||
    Boolean(waybill) ||
    String(data?.rmk || data?.remark || '').toLowerCase().includes('success')

  if (!success && !waybill) {
    const msg =
      data?.rmk ||
      data?.remark ||
      data?.error ||
      data?.packages?.[0]?.remarks ||
      data?.packages?.[0]?.status ||
      JSON.stringify(data)
    throw new Error(typeof msg === 'string' ? msg : 'Delhivery shipment creation failed')
  }

  return {
    success: true,
    waybill: waybill ? String(waybill) : null,
    orderRef,
    raw: data,
    message: data?.rmk || data?.remark || 'Shipment created',
    trackingUrl: waybill
      ? `https://www.delhivery.com/track/package/${waybill}`
      : null,
  }
}

/** Packing slip JSON from Delhivery (used for label data). */
export async function getPackingSlip(waybill) {
  const { base } = getConfig()
  const url = `${base}/api/p/packing_slip?wbns=${encodeURIComponent(waybill)}`
  const { data } = await axios.get(url, { headers: authHeaders() })
  return data
}

function isPdfBuffer(buf) {
  return Buffer.isBuffer(buf) && buf.length > 4 && buf.slice(0, 4).toString() === '%PDF'
}

/** Decode official Delhivery packing-slip PDF from packing_slip?pdf=true JSON. */
function extractOfficialPdfFromJson(json) {
  const packages = Array.isArray(json?.packages) ? json.packages : []
  const candidates = [
    ...packages.map((p) => p?.pdf_encoding).filter(Boolean),
    json?.pdf_encoding,
  ]

  for (const enc of candidates) {
    try {
      const pdfBuf = Buffer.from(String(enc), 'base64')
      if (isPdfBuffer(pdfBuf)) return pdfBuf
    } catch {
      // try next
    }
  }

  return null
}

async function downloadPdfUrl(link) {
  if (!link || !/^https?:\/\//i.test(link)) return null
  // S3 signed URLs must NOT include Delhivery Authorization headers
  const pdfRes = await axios.get(link, {
    responseType: 'arraybuffer',
    validateStatus: (s) => s < 500,
    timeout: 60000,
  })
  const pdfBuf = Buffer.from(pdfRes.data || [])
  return isPdfBuffer(pdfBuf) ? pdfBuf : null
}

/**
 * Fetch the official Delhivery packing-slip PDF for one or more AWBs.
 * With pdf=true, Delhivery returns JSON containing pdf_encoding (base64) and/or pdf_download_link.
 */
export async function getPackingSlipPdf(waybillOrWaybills) {
  const { base } = getConfig()
  const waybills = (Array.isArray(waybillOrWaybills) ? waybillOrWaybills : [waybillOrWaybills])
    .map((w) => String(w || '').trim())
    .filter(Boolean)
  if (waybills.length === 0) return null

  const wbns = waybills.join(',')
  const urls = [
    `${base}/api/p/packing_slip?wbns=${encodeURIComponent(wbns)}&pdf=true`,
    `${base}/api/p/packing_slip?wbns=${encodeURIComponent(wbns)}&pdf=true&pdf_size=A4`,
  ]

  for (const url of urls) {
    try {
      const { data, status, headers } = await axios.get(url, {
        headers: {
          ...authHeaders(),
          Accept: 'application/json',
        },
        responseType: 'arraybuffer',
        validateStatus: (s) => s < 500,
        timeout: 60000,
        maxContentLength: 50 * 1024 * 1024,
        maxBodyLength: 50 * 1024 * 1024,
      })
      if (status >= 400 || !data) continue
      const buf = Buffer.from(data)
      if (isPdfBuffer(buf)) return buf

      const ct = String(headers['content-type'] || '')
      if (ct.includes('json') || buf.slice(0, 1).toString() === '{') {
        const json = JSON.parse(buf.toString('utf8'))

        // 1) Embedded official PDF (preferred)
        const fromEncoding = extractOfficialPdfFromJson(json)
        if (fromEncoding) return fromEncoding

        // 2) Signed S3 download link(s)
        const packages = Array.isArray(json?.packages) ? json.packages : []
        const links = [
          ...packages.map((p) => p?.pdf_download_link).filter(Boolean),
          json?.pdf_download_link,
          ...(Array.isArray(json?.pdf_links) ? json.pdf_links : []),
          packages[0]?.pdf,
        ].filter(Boolean)

        for (const link of links) {
          try {
            const pdfBuf = await downloadPdfUrl(link)
            if (pdfBuf) return pdfBuf
          } catch {
            // try next link
          }
        }
      }
    } catch (e) {
      console.warn('Delhivery packing-slip PDF fetch failed:', e.message)
    }
  }
  return null
}

/**
 * Schedule warehouse pickup with Delhivery.
 * @param {{ pickupDate: string, pickupTime?: string, pickupLocation?: string, expectedPackageCount?: number }} opts
 */
export async function createPickupRequest({
  pickupDate,
  pickupTime = '14:00:00',
  pickupLocation,
  expectedPackageCount = 1,
}) {
  const { base, pickupName } = getConfig()
  if (!pickupDate) throw new Error('Pickup date is required')

  // Normalize time to hh:mm:ss
  let time = pickupTime || '14:00:00'
  if (/^\d{2}:\d{2}$/.test(time)) time = `${time}:00`

  const url = `${base}/fm/request/new/`
  const payload = {
    pickup_time: time,
    pickup_date: pickupDate, // YYYY-MM-DD
    pickup_location: pickupLocation || pickupName,
    expected_package_count: Number(expectedPackageCount) || 1,
  }

  const { data } = await axios.post(url, payload, {
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
  })

  const pickupId =
    data?.pickup_id ||
    data?.pickupId ||
    data?.data?.pickup_id ||
    data?.id ||
    null

  if (data?.success === false || data?.error) {
    throw new Error(data?.error || data?.message || 'Pickup request failed')
  }

  return {
    success: true,
    pickupId: pickupId ? String(pickupId) : null,
    raw: data,
    message: data?.message || data?.remark || 'Pickup scheduled',
    pickupDate,
    pickupTime: time,
    pickupLocation: payload.pickup_location,
  }
}
