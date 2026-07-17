import { jsPDF } from 'jspdf'
import bwip from 'bwip-js'
import { getDelhiveryOrderRef, getPublicOrderNumber } from '@/lib/orderNumber'

const bwipjs = bwip?.toBuffer ? bwip : bwip?.default || bwip

function orderNumber(order) {
  return getPublicOrderNumber(order)
}

function invoiceRef(order, pkg) {
  const fromPkg = pkg?.oid || pkg?.order || pkg?.order_id || pkg?.seller_inv
  if (fromPkg) return String(fromPkg)
  return getDelhiveryOrderRef(order)
}

function getPkg(slip) {
  if (!slip) return null
  if (Array.isArray(slip.packages) && slip.packages[0]) return slip.packages[0]
  if (Array.isArray(slip) && slip[0]) return slip[0]
  return slip.package || slip.data?.packages?.[0] || null
}

function paymentType(order, pkg) {
  const fromPkg = pkg?.pt || pkg?.product_type || pkg?.payment_mode
  if (fromPkg) {
    const s = String(fromPkg).toUpperCase()
    if (s.includes('COD')) return 'COD'
    return s
  }
  const m = String(order?.paymentMethod || '').toUpperCase()
  if (m.includes('COD') || m === 'CASH_ON_DELIVERY') return 'COD'
  return 'PREPAID'
}

function shippingMode(pkg) {
  return String(pkg?.mot || pkg?.shipping_mode || process.env.DELHIVERY_SHIPPING_MODE || 'Surface')
}

function amount(order, pkg) {
  const pay = paymentType(order, pkg)
  if (pay === 'COD') {
    const fromPkg = Number(pkg?.cod_amount ?? pkg?.cod ?? 0)
    if (fromPkg > 0) return fromPkg
  }
  return Number(order?.total || pkg?.total_amount || 0)
}

function consignee(order, pkg) {
  const c = pkg?.consignee || pkg?.customer || {}
  const addr = order?.shippingAddress || {}
  const street = addr.street || addr.address || ''
  return {
    name: c.name || addr.name || order?.guestName || 'Customer',
    address:
      c.address ||
      c.add ||
      [street, addr.city, addr.district, addr.state, addr.country || 'INDIA']
        .filter(Boolean)
        .join(', ') ||
      '',
    city: c.city || addr.city || '',
    state: c.state || addr.state || '',
    pin: String(c.pin || c.pincode || addr.zip || addr.pincode || ''),
    phone: String(c.phone || c.mobile || addr.phone || order?.guestPhone || ''),
    hub:
      pkg?.destination ||
      pkg?.cn ||
      pkg?.destination_city ||
      [addr.city, addr.state].filter(Boolean).join(', ') ||
      '',
  }
}

function sellerInfo() {
  return {
    name: process.env.DELHIVERY_SELLER_NAME || 'Nilaas',
    address: process.env.DELHIVERY_SELLER_ADDRESS || process.env.DELHIVERY_RETURN_ADDRESS || '',
    returnName: process.env.DELHIVERY_RETURN_NAME || 'Nilaas shop',
  }
}

function productRows(order, pkg) {
  const items = order?.orderItems || []
  if (items.length) {
    return items.map((i) => {
      const qty = Number(i.quantity || 1)
      const price = Number(i.price || 0)
      return {
        name: i.name || i.productId?.name || 'Item',
        qty,
        price,
        total: price * qty,
      }
    })
  }
  const desc = pkg?.products || pkg?.product_description || pkg?.prd || 'Apparel'
  const total = amount(order, pkg)
  return [{ name: String(desc), qty: 1, price: total, total }]
}

async function makeBarcodePng(text, { height = 12, scale = 2 } = {}) {
  try {
    const png = await bwipjs.toBuffer({
      bcid: 'code128',
      text: String(text),
      scale,
      height,
      includetext: false,
      backgroundcolor: 'FFFFFF',
    })
    return `data:image/png;base64,${png.toString('base64')}`
  } catch (e) {
    console.warn('Barcode generation failed:', e.message)
    return null
  }
}

function hr(doc, x1, y, x2) {
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.35)
  doc.line(x1, y, x2, y)
}

/**
 * Official Delhivery CL-panel style packing slip (single label).
 */
export async function drawOfficialPackingSlip(doc, { order, waybill, slip }) {
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const m = 8
  const contentW = pageW - m * 2
  const pkg = getPkg(slip)
  const awb = String(pkg?.wbn || pkg?.waybill || waybill || '')
  const sortCode = String(pkg?.sort_code || pkg?.sortcode || '')
  const pay = paymentType(order, pkg)
  const mode = shippingMode(pkg)
  const amt = amount(order, pkg)
  const to = consignee(order, pkg)
  const inv = invoiceRef(order, pkg)
  const seller = sellerInfo()
  const rows = productRows(order, pkg)
  const dateStr = order?.createdAt
    ? new Date(order.createdAt).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    : new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })

  // Outer border
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.5)
  doc.rect(m - 2, m - 2, contentW + 4, pageH - m * 2 + 4)

  let y = m + 2

  // —— Header: seller + DELHIVERY ——
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(180, 0, 0)
  doc.text(seller.name.toUpperCase().slice(0, 12), m, y + 4)
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(16)
  doc.text('DELHIVERY', pageW - m, y + 4, { align: 'right' })
  // red accent on I
  doc.setFillColor(220, 0, 0)
  doc.circle(pageW - m - 28.5, y - 0.5, 0.9, 'F')
  y += 9

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`AWB# ${awb}`, m, y)
  y += 4

  // —— Main AWB barcode ——
  const mainBarcode = await makeBarcodePng(awb, { height: 16, scale: 3 })
  const bw = Math.min(contentW - 10, 120)
  const bh = 22
  if (mainBarcode) {
    doc.addImage(mainBarcode, 'PNG', m + (contentW - bw) / 2, y, bw, bh)
    y += bh + 5
  } else {
    y += 4
  }

  // PIN | AWB | Sort under barcode
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text(to.pin || '—', m, y)
  doc.text(`AWB# ${awb}`, pageW / 2, y, { align: 'center' })
  doc.text(sortCode || '', pageW - m, y, { align: 'right' })
  y += 3
  hr(doc, m, y, pageW - m)
  y += 6

  // —— Two columns: Ship to | COD ——
  const colGap = 4
  const leftW = contentW * 0.58
  const rightX = m + leftW + colGap
  const rightW = contentW - leftW - colGap
  const colTop = y

  // Left: Ship to
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Ship to - ', m, y)
  const nameX = m + doc.getTextWidth('Ship to - ')
  doc.setFont('helvetica', 'bold')
  doc.text(to.name, nameX, y)
  y += 4.5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  const addrLines = doc.splitTextToSize(to.address, leftW)
  doc.text(addrLines.slice(0, 4), m, y)
  y += Math.min(addrLines.length, 4) * 3.4 + 1

  if (to.hub) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    const hubLines = doc.splitTextToSize(to.hub, leftW)
    doc.text(hubLines.slice(0, 2), m, y)
    y += Math.min(hubLines.length, 2) * 3.6
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text(`PIN - ${to.pin}`, m, y)
  if (to.phone) {
    y += 3.8
    doc.text(`Ph: ${to.phone}`, m, y)
  }
  const leftBottom = y

  // Right: payment block
  let ry = colTop
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text(`${pay} - ${mode}`, rightX, ry)
  ry += 6
  doc.setFontSize(16)
  doc.text(`INR ${amt.toLocaleString('en-IN')}`, rightX, ry)
  ry += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(`Inv# ${inv}`, rightX, ry)
  ry += 4
  doc.setFont('helvetica', 'bold')
  doc.text('Date', rightX, ry)
  doc.setFont('helvetica', 'normal')
  ry += 3.5
  doc.text(dateStr, rightX, ry)

  y = Math.max(leftBottom, ry) + 4
  hr(doc, m, y, pageW - m)
  y += 5

  // —— Seller + invoice barcode ——
  const sellerTop = y
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text(`Seller: ${seller.name}`, m, y)
  y += 3.5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  if (seller.address) {
    const sLines = doc.splitTextToSize(seller.address, leftW)
    doc.text(sLines.slice(0, 3), m, y)
    y += Math.min(sLines.length, 3) * 3.2
  }

  // Invoice barcode on right
  const invBarcode = await makeBarcodePng(inv, { height: 8, scale: 2 })
  const ibw = Math.min(rightW, 55)
  const ibh = 12
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.text(inv, pageW - m - ibw / 2, sellerTop, { align: 'center' })
  if (invBarcode) {
    doc.addImage(invBarcode, 'PNG', pageW - m - ibw, sellerTop + 1.5, ibw, ibh)
  }

  y = Math.max(y, sellerTop + ibh + 6)
  hr(doc, m, y, pageW - m)
  y += 5

  // —— Product table ——
  const cols = {
    name: m,
    qty: m + contentW * 0.55,
    price: m + contentW * 0.68,
    total: pageW - m,
  }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('Product Name', cols.name, y)
  doc.text('Qty.', cols.qty, y)
  doc.text('Price', cols.price, y)
  doc.text('Total', cols.total, y, { align: 'right' })
  y += 2
  hr(doc, m, y, pageW - m)
  y += 4

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  for (const row of rows.slice(0, 6)) {
    const nameLines = doc.splitTextToSize(row.name, contentW * 0.52)
    doc.text(nameLines.slice(0, 2), cols.name, y)
    doc.text(String(row.qty), cols.qty, y)
    doc.text(String(row.price), cols.price, y)
    doc.text(String(row.total), cols.total, y, { align: 'right' })
    y += Math.max(nameLines.length, 1) * 3.5 + 1
  }

  // —— Footer return address ——
  const footerY = pageH - m - 8
  hr(doc, m, footerY - 4, pageW - m)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  const ret = `Return Address: ${seller.returnName}${seller.address ? `, ${seller.address}` : ''}`
  const retLines = doc.splitTextToSize(ret, contentW * 0.72)
  doc.text(retLines.slice(0, 2), m, footerY)
  doc.text('Page 1 of 1', pageW - m, footerY, { align: 'right' })
}

/**
 * Compact 4-up label (still Delhivery-style with barcode) for bulk print.
 */
export async function drawShippingLabel(doc, { order, waybill, slip, x, y, w, h }) {
  const pkg = getPkg(slip)
  const awb = String(pkg?.wbn || pkg?.waybill || waybill || '')
  const sortCode = String(pkg?.sort_code || pkg?.sortcode || '')
  const pay = paymentType(order, pkg)
  const mode = shippingMode(pkg)
  const amt = amount(order, pkg)
  const to = consignee(order, pkg)
  const inv = invoiceRef(order, pkg)
  const pad = 2.5
  const maxX = x + w - pad

  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.4)
  doc.rect(x, y, w, h)

  let cy = y + pad + 1

  // Header logos row
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(180, 0, 0)
  doc.text('NILAAS', x + pad, cy + 2)
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(9)
  doc.text('DELHIVERY', maxX, cy + 2, { align: 'right' })
  cy += 5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.text(`AWB# ${awb}`, x + pad, cy)
  cy += 2.5

  const barcode = await makeBarcodePng(awb, { height: 10, scale: 2 })
  const bw = Math.min(w - pad * 2, 62)
  const bh = 12
  if (barcode) {
    doc.addImage(barcode, 'PNG', x + (w - bw) / 2, cy, bw, bh)
    cy += bh + 3.5
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  doc.text(to.pin || '', x + pad, cy)
  doc.text(`AWB# ${awb}`, x + w / 2, cy, { align: 'center' })
  doc.text(sortCode, maxX, cy, { align: 'right' })
  cy += 2
  hr(doc, x + pad, cy, maxX)
  cy += 3.5

  // Ship to + payment
  doc.setFontSize(6.5)
  doc.setFont('helvetica', 'normal')
  doc.text('Ship to - ', x + pad, cy)
  doc.setFont('helvetica', 'bold')
  doc.text(to.name, x + pad + 12, cy)
  doc.setFontSize(7)
  doc.text(`${pay} - ${mode}`, maxX, cy, { align: 'right' })
  cy += 3.2

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6)
  const addrLines = doc.splitTextToSize(to.address, w * 0.55)
  doc.text(addrLines.slice(0, 3), x + pad, cy)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text(`INR ${amt.toLocaleString('en-IN')}`, maxX, cy + 2, { align: 'right' })
  cy += Math.min(addrLines.length, 3) * 2.6 + 1

  doc.setFontSize(6.5)
  if (to.hub) {
    const hubLines = doc.splitTextToSize(to.hub, w * 0.55)
    doc.text(hubLines.slice(0, 1), x + pad, cy)
    cy += 2.8
  }
  doc.text(`PIN - ${to.pin}`, x + pad, cy)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6)
  doc.text(`Inv# ${inv}`, maxX, cy, { align: 'right' })
  cy += 3
  hr(doc, x + pad, cy, maxX)
  cy += 3

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6)
  doc.text('PRODUCTS', x + pad, cy)
  cy += 2.8
  doc.setFont('helvetica', 'normal')
  const items = productRows(order, pkg)
    .map((r) => `${r.qty}x ${r.name}`)
    .join(', ')
    .slice(0, 100)
  const itemLines = doc.splitTextToSize(items, w - pad * 2)
  doc.text(itemLines.slice(0, 2), x + pad, cy)

  // Footer AWB
  doc.setFillColor(245, 245, 245)
  doc.rect(x + 0.4, y + h - 9, w - 0.8, 8.6, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text(awb, x + w / 2, y + h - 3.5, { align: 'center' })
}

/** Single official packing slip (A5) — matches Delhivery CL panel. */
export async function buildSingleLabelPdf({ order, waybill, slip }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' })
  await drawOfficialPackingSlip(doc, { order, waybill, slip })
  return Buffer.from(doc.output('arraybuffer'))
}

/** Bulk: 4 compact labels per A4. */
export async function buildBulkLabelsPdf(items = []) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 5
  const gap = 3
  const cellW = (pageW - margin * 2 - gap) / 2
  const cellH = (pageH - margin * 2 - gap) / 2
  const positions = [
    { x: margin, y: margin },
    { x: margin + cellW + gap, y: margin },
    { x: margin, y: margin + cellH + gap },
    { x: margin + cellW + gap, y: margin + cellH + gap },
  ]

  for (let index = 0; index < items.length; index++) {
    const slot = index % 4
    if (index > 0 && slot === 0) doc.addPage()
    const { x, y } = positions[slot]
    await drawShippingLabel(doc, {
      order: items[index].order,
      waybill: items[index].waybill,
      slip: items[index].slip,
      x,
      y,
      w: cellW,
      h: cellH,
    })
  }

  if (!items.length) {
    doc.setFontSize(12)
    doc.text('No AWB labels selected', pageW / 2, pageH / 2, { align: 'center' })
  }

  return Buffer.from(doc.output('arraybuffer'))
}
