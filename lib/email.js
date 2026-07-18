import fs from 'fs'
import path from 'path'
import { Resend } from 'resend'
import nodemailer from 'nodemailer'
import { computeShortOrderNumber, getPublicOrderNumber, ORDER_STATUSES } from '@/lib/orderNumber'

const STATUS_LABEL = Object.fromEntries(ORDER_STATUSES.map((s) => [s.value, s.label]))

const STATUS_EMAIL_COPY = {
  ORDER_PLACED: {
    title: 'Order placed',
    message:
      'Thank you for shopping with Nilaas. Your order has been placed successfully and we will start preparing it shortly.',
  },
  CONFIRMED: {
    title: 'Order confirmed',
    message: 'Your order is confirmed. Our team will begin packing your pieces soon.',
  },
  PROCESSING: {
    title: 'Order processing',
    message: 'We have received your order and our team is getting it ready to ship.',
  },
  MANIFESTED: {
    title: 'Shipment manifested',
    message:
      'Your order has been manifested with Delhivery and a shipping label (AWB) has been created. Pickup will follow shortly.',
  },
  PICKUP_REQUESTED: {
    title: 'Pickup requested',
    message: 'A pickup has been requested with our delivery partner for your order.',
  },
  WAITING_FOR_PICKUP: {
    title: 'Waiting for pickup',
    message: 'Your order is packed and waiting for pickup by our delivery partner.',
  },
  PICKED_UP: {
    title: 'Order picked up',
    message: 'Your order has been picked up from our warehouse and is moving through the courier network.',
  },
  WAREHOUSE_RECEIVED: {
    title: 'At courier warehouse',
    message: 'Your order has reached the courier warehouse and will be shipped onward soon.',
  },
  SHIPPED: {
    title: 'Order shipped',
    message: 'Great news — your order is on its way. You can track the shipment using the details below.',
  },
  IN_TRANSIT: {
    title: 'In transit',
    message: 'Your order is in transit with Delhivery and moving toward your city.',
  },
  OUT_FOR_DELIVERY: {
    title: 'Out for delivery',
    message: 'Your order is out for delivery today. Please keep your phone nearby for the delivery executive.',
  },
  UNDELIVERED: {
    title: 'Delivery attempt pending',
    message:
      'A delivery attempt was not completed. Delhivery will try again, or our team will contact you if needed.',
  },
  DELIVERED: {
    title: 'Order delivered',
    message: 'Your order has been delivered. We hope you love your Nilaas pieces.',
  },
  RETURN_REQUESTED: {
    title: 'Return requested',
    message: 'Your return request has been received. Our team will review it and update you shortly.',
  },
  RETURNED: {
    title: 'Order returned',
    message: 'Your return has been processed. Any eligible refund will be issued soon.',
  },
  RTO: {
    title: 'Returned to origin (RTO)',
    message:
      'Your shipment could not be delivered and is returning to our warehouse (RTO). Our support team will contact you with next steps.',
  },
  CANCELLED: {
    title: 'Order cancelled',
    message: 'Your order has been cancelled. If this was unexpected, reply to this email or contact support.',
  },
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const smtpTransporter =
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT, 10) || 465,
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
    : null

const BRAND = '#2a1210'
const BRAND_SOFT = '#6b2f28'
const MUTED = '#9a7d72'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://nilaas.in'
// Customer-facing support contact (never use admin Gmail / QuickFynd)
const SUPPORT_EMAIL = 'support@nilaas.in'
// Light/cream wordmark for dark email header. Prefer CID embed; HTTPS as fallback.
const LOGO_CID = 'nilaas-logo'
const LOGO_HTTPS_URL =
  process.env.EMAIL_LOGO_URL ||
  `${APP_URL.replace(/\/$/, '')}/logo-nilaas-email.png`
const FROM_EMAIL = process.env.EMAIL_FROM || process.env.SMTP_USER || 'noreply@nilaas.in'
const FROM_NAME = process.env.EMAIL_FROM_NAME || 'Nilaas'
const FROM = `${FROM_NAME} <${FROM_EMAIL}>`

function getEmailLogoFile() {
  const candidates = [
    path.join(process.cwd(), 'public', 'logo-nilaas-email.png'),
    path.join(process.cwd(), 'public', 'logo-nilaas.png'),
    path.join(process.cwd(), 'assets', 'logo', 'Asset 8.png'),
  ]
  for (const filePath of candidates) {
    try {
      if (fs.existsSync(filePath)) {
        return { filePath, content: fs.readFileSync(filePath) }
      }
    } catch {
      // try next
    }
  }
  return null
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function absoluteUrl(url) {
  if (!url) return ''
  const s = String(url).trim()
  if (!s) return ''
  if (/^https?:\/\//i.test(s)) return s
  const base = process.env.NEXT_PUBLIC_S3_BASE_URL || APP_URL
  return `${base.replace(/\/$/, '')}/${s.replace(/^\//, '')}`
}

function orderRef(orderOrId) {
  // Order ID === Order Number (shortOrderNumber)
  if (orderOrId && typeof orderOrId === 'object') {
    return getPublicOrderNumber(orderOrId) || String(orderOrId._id || '').slice(-8).toUpperCase()
  }
  const n = computeShortOrderNumber(orderOrId)
  return n != null ? String(n) : String(orderOrId || '').slice(-8).toUpperCase()
}

function formatInr(amount) {
  return `₹${Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function asProductDoc(ref) {
  if (!ref || typeof ref !== 'object') return null
  // Populated product has a name; bare ObjectId does not
  if (typeof ref.name === 'string' && ref.name) return ref
  if (Array.isArray(ref.images) || ref.image) return ref
  return null
}

function getItemMeta(item = {}) {
  const product = asProductDoc(item.productId) || asProductDoc(item.product) || {}

  const name =
    item.name ||
    product.name ||
    item.title ||
    product.title ||
    'Item'

  const rawImage =
    item.image ||
    (Array.isArray(product.images) ? product.images[0] : null) ||
    product.image ||
    ''
  const image = absoluteUrl(
    typeof rawImage === 'object' && rawImage?.url ? rawImage.url : rawImage
  )
  const qty = Number(item.quantity) || 1
  const lineTotal = (Number(item.price) || Number(product.price) || 0) * qty
  return { name, image, qty, lineTotal }
}

/** Ensure orderItems have product name/image (populate when missing). */
async function withProductDetails(orderItems = []) {
  if (!Array.isArray(orderItems) || orderItems.length === 0) return []
  const needsLookup = orderItems.some((item) => {
    const hasName = Boolean(item?.name)
    const populated = Boolean(asProductDoc(item?.productId)?.name)
    return !hasName && !populated
  })
  if (!needsLookup) return orderItems

  try {
    const Product = (await import('@/models/Product')).default
    const ids = [
      ...new Set(
        orderItems
          .map((i) => {
            const id = i?.productId?._id || i?.productId
            return id ? String(id) : null
          })
          .filter(Boolean)
      ),
    ]
    if (ids.length === 0) return orderItems
    const products = await Product.find({ _id: { $in: ids } })
      .select('name images image price')
      .lean()
    const byId = new Map(products.map((p) => [String(p._id), p]))
    return orderItems.map((item) => {
      if (item?.name && (item.image || asProductDoc(item.productId)?.images)) return item
      const id = String(item?.productId?._id || item?.productId || '')
      const p = byId.get(id)
      if (!p) return item
      return {
        ...((item && typeof item.toObject === 'function') ? item.toObject() : item),
        name: item.name || p.name,
        image: item.image || (Array.isArray(p.images) ? p.images[0] : '') || p.image || '',
        productId: p,
      }
    })
  } catch (e) {
    console.warn('[email] product detail lookup failed:', e.message)
    return orderItems
  }
}

function buildItemsRows(orderItems = []) {
  if (!orderItems.length) {
    return `
      <tr>
        <td style="padding:16px;color:${MUTED};font-size:14px;">No items</td>
      </tr>`
  }

  return orderItems
    .map((item) => {
      const { name, image, qty, lineTotal } = getItemMeta(item)
      return `
      <tr>
        <td style="padding:14px 16px;border-bottom:1px solid #eee;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td width="72" valign="top" style="padding-right:14px;">
                ${
                  image
                    ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(name)}" width="64" height="80" style="display:block;width:64px;height:80px;object-fit:cover;border:1px solid #eee;background:#f5f5f5;" />`
                    : `<div style="width:64px;height:80px;background:#f3f0ee;border:1px solid #eee;"></div>`
                }
              </td>
              <td valign="middle" style="font-family:Georgia,'Times New Roman',serif;color:${BRAND};font-size:15px;line-height:1.35;">
                <strong style="font-weight:600;">${escapeHtml(name)}</strong><br/>
                <span style="font-family:Arial,Helvetica,sans-serif;color:${MUTED};font-size:13px;">Qty: ${qty}</span>
              </td>
              <td width="90" valign="middle" align="right" style="font-family:Arial,Helvetica,sans-serif;color:${BRAND};font-size:15px;font-weight:700;white-space:nowrap;">
                ${formatInr(lineTotal)}
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    })
    .join('')
}

function emailShell({ headerTitle, headerSubtitle, bodyHtml }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(headerTitle)} · Nilaas</title>
</head>
<body style="margin:0;padding:0;background:#f3f0ee;font-family:Arial,Helvetica,sans-serif;color:${BRAND};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f0ee;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border:1px solid #e8e0db;">
          <tr>
            <td style="background:${BRAND};padding:32px 24px 28px;text-align:center;">
              <a href="${APP_URL}" style="text-decoration:none;display:inline-block;">
                <img
                  src="cid:${LOGO_CID}"
                  alt="Nilaas"
                  width="120"
                  style="display:block;margin:0 auto 8px;width:120px;height:auto;max-width:120px;border:0;outline:none;text-decoration:none;"
                />
              </a>
              <div style="font-family:Georgia,'Times New Roman',serif;color:#f5efe9;font-size:13px;letter-spacing:0.28em;text-transform:uppercase;margin:0 0 18px;">
                Nilaas
              </div>
              <div style="font-family:Georgia,'Times New Roman',serif;color:#ffffff;font-size:24px;line-height:1.25;font-weight:700;margin:0 0 6px;">
                ${headerTitle}
              </div>
              ${
                headerSubtitle
                  ? `<div style="color:rgba(255,255,255,0.85);font-size:14px;line-height:1.4;">${headerSubtitle}</div>`
                  : ''
              }
            </td>
          </tr>
          <tr>
            <td style="padding:28px 24px 8px;background:#ffffff;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 24px 28px;background:#ffffff;">
              <p style="margin:0 0 18px;font-size:13px;line-height:1.6;color:${MUTED};">
                We’ll email you again when your order ships. Questions?
                <a href="mailto:${SUPPORT_EMAIL}" style="color:${BRAND};text-decoration:underline;">${SUPPORT_EMAIL}</a>
              </p>
              <p style="margin:0;text-align:center;font-size:12px;color:${MUTED};">
                © ${new Date().getFullYear()} Nilaas · <a href="${APP_URL}" style="color:${BRAND};text-decoration:none;">nilaas.in</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function ctaButton(href, label) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:8px auto 20px;">
      <tr>
        <td style="background:${BRAND};">
          <a href="${escapeHtml(href)}" style="display:inline-block;padding:14px 32px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;letter-spacing:0.04em;color:#ffffff;text-decoration:none;">
            ${escapeHtml(label)}
          </a>
        </td>
      </tr>
    </table>`
}

function cardBox(inner) {
  return `<div style="border:1px solid #e8e0db;padding:16px 18px;margin:0 0 16px;background:#fff;">${inner}</div>`
}

/**
 * Send email using Resend, falling back to SMTP.
 * Logo is embedded as CID so it shows even if the public URL is unavailable.
 */
export async function sendMail({ to, subject, html }) {
  const logoFile = getEmailLogoFile()
  // Prefer embedded CID; fall back to hosted HTTPS if file missing
  const htmlWithLogo = logoFile
    ? html
    : html.replace(`cid:${LOGO_CID}`, LOGO_HTTPS_URL)

  if (resend) {
    try {
      const payload = {
        from: FROM,
        to: [to],
        subject,
        html: htmlWithLogo,
      }
      if (logoFile) {
        payload.attachments = [
          {
            filename: 'logo-nilaas-email.png',
            content: logoFile.content.toString('base64'),
            content_id: LOGO_CID,
            contentType: 'image/png',
          },
        ]
      }
      const { data, error } = await resend.emails.send(payload)
      if (error) {
        console.error('Email sending error (Resend):', error)
        throw error
      }
      return data
    } catch (error) {
      console.error('Failed to send email (Resend):', error)
      // fall through to SMTP if configured
      if (!smtpTransporter) throw error
    }
  }

  if (smtpTransporter) {
    try {
      const mail = {
        from: FROM,
        to,
        subject,
        html: htmlWithLogo,
      }
      if (logoFile) {
        mail.attachments = [
          {
            filename: 'logo-nilaas-email.png',
            content: logoFile.content,
            cid: LOGO_CID,
            contentType: 'image/png',
            contentDisposition: 'inline',
          },
        ]
      }
      return await smtpTransporter.sendMail(mail)
    } catch (error) {
      console.error('Failed to send email (SMTP):', error)
      throw error
    }
  }

  throw new Error('No email provider configured. Please set RESEND_API_KEY or SMTP credentials.')
}

async function resolveOrderCustomer(order) {
  let email = order?.guestEmail || order?.email || ''
  let name = order?.guestName || order?.name || ''

  if (order?.userId && typeof order.userId === 'object') {
    if (!email && order.userId.email) email = order.userId.email
    if (!name && order.userId.name) name = order.userId.name
  }

  const uid =
    typeof order?.userId === 'string'
      ? order.userId
      : order?.userId?._id
        ? String(order.userId._id)
        : ''

  if ((!email || !name) && uid && uid !== 'guest') {
    try {
      const User = (await import('@/models/User')).default
      const user = await User.findById(uid).lean()
      if (user) {
        if (!email && user.email) email = user.email
        if (!name && user.name) name = user.name
      }
    } catch (e) {
      console.warn('[email] User lookup failed:', e.message)
    }
  }

  return { email: String(email || '').trim(), name: String(name || '').trim() }
}

/**
 * Send branded status email for any order status.
 * Returns { sent, to, reason?, result? }
 */
export async function sendOrderStatusEmail(order, status) {
  const { email, name } = await resolveOrderCustomer(order)
  if (!email) {
    return { sent: false, reason: 'No customer email on order' }
  }

  const trackingId = order.trackingId || order.delhiveryWaybill || ''
  const trackingUrl = order.trackingUrl || ''
  const courier = order.courier || ''

  const orderItems = await withProductDetails(order.orderItems || [])
  const orderForEmail = { ...((order && typeof order.toObject === 'function') ? order.toObject() : order), orderItems }

  // Full confirmation template for initial place (items + address)
  if (status === 'ORDER_PLACED') {
    const result = await sendOrderConfirmationEmail({
      email,
      name,
      orderId: order._id,
      shortOrderNumber: order.shortOrderNumber,
      total: order.total,
      orderItems,
      shippingAddress: order.shippingAddress,
      createdAt: order.createdAt,
      paymentMethod: order.paymentMethod,
    })
    return { sent: true, to: email, result }
  }

  // Rich shipped template with tracking
  if (status === 'SHIPPED') {
    const result = await sendOrderShippedEmail({
      email,
      name,
      orderId: order._id,
      trackingId,
      trackingUrl,
      courier,
      order: orderForEmail,
    })
    return { sent: true, to: email, result }
  }

  const copy = STATUS_EMAIL_COPY[status] || {
    title: `Order update: ${STATUS_LABEL[status] || status}`,
    message: `Your order status has been updated to ${STATUS_LABEL[status] || status}.`,
  }

  const result = await statusEmail({
    email,
    name,
    order,
    status,
    title: copy.title,
    message: copy.message,
  })
  return { sent: true, to: email, result }
}

function statusEmail({ email, name, order, status, title, message }) {
  const ref = orderRef(order)
  const statusLabel = STATUS_LABEL[status] || status || 'Updated'
  const trackingId = order?.trackingId || order?.delhiveryWaybill || ''
  const trackingUrl =
    order?.trackingUrl ||
    (trackingId ? `https://www.delhivery.com/track/package/${trackingId}` : '')
  const courier = order?.courier || ''

  const trackingBlock =
    trackingId || trackingUrl
      ? cardBox(`
          <div style="font-size:14px;color:${BRAND};line-height:1.7;">
            <strong>Tracking</strong><br/>
            ${courier ? `Courier: ${escapeHtml(courier)}<br/>` : ''}
            ${trackingId ? `AWB / Tracking ID: <span style="font-family:monospace;">${escapeHtml(trackingId)}</span><br/>` : ''}
            ${trackingUrl ? `<a href="${escapeHtml(trackingUrl)}" style="color:${BRAND_SOFT};">Track shipment</a>` : ''}
          </div>
        `)
      : ''

  const html = emailShell({
    headerTitle: title,
    headerSubtitle: `Order #${ref}`,
    bodyHtml: `
      <p style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:20px;color:${BRAND};">
        Hi ${escapeHtml(name || 'there')},
      </p>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:${BRAND_SOFT};">${message}</p>
      ${cardBox(`
        <div style="font-size:14px;color:${BRAND};line-height:1.7;">
          <strong>Order ID:</strong> <span style="font-family:monospace;">${escapeHtml(ref)}</span><br/>
          <strong>Status:</strong> ${escapeHtml(statusLabel)}
        </div>
      `)}
      ${trackingBlock}
      ${ctaButton(
        trackingUrl || `${APP_URL}/track-order?orderId=${encodeURIComponent(String(order?._id || ''))}`,
        trackingUrl ? 'Track shipment' : 'Track order'
      )}
      <p style="margin:18px 0 0;font-size:12px;color:${MUTED};text-align:center;">
        Need help? Email <a href="mailto:${SUPPORT_EMAIL}" style="color:${BRAND_SOFT};">${SUPPORT_EMAIL}</a>
      </p>
    `,
  })
  return sendMail({
    to: email,
    subject: `${title} · #${ref} · Nilaas`,
    html,
  })
}

export async function sendOrderWaitingForPickupEmail({ email, name, order }) {
  return statusEmail({ ...STATUS_EMAIL_COPY.WAITING_FOR_PICKUP, email, name, order, status: 'WAITING_FOR_PICKUP' })
}

export async function sendOrderOutForDeliveryEmail({ email, name, order }) {
  return statusEmail({ ...STATUS_EMAIL_COPY.OUT_FOR_DELIVERY, email, name, order, status: 'OUT_FOR_DELIVERY' })
}

export async function sendOrderReturnRequestedEmail({ email, name, order }) {
  return statusEmail({ ...STATUS_EMAIL_COPY.RETURN_REQUESTED, email, name, order, status: 'RETURN_REQUESTED' })
}

export async function sendOrderConfirmedEmail({ email, name, order }) {
  return statusEmail({ ...STATUS_EMAIL_COPY.CONFIRMED, email, name, order, status: 'CONFIRMED' })
}

export async function sendOrderPickupRequestedEmail({ email, name, order }) {
  return statusEmail({ ...STATUS_EMAIL_COPY.PICKUP_REQUESTED, email, name, order, status: 'PICKUP_REQUESTED' })
}

export async function sendOrderPickedUpEmail({ email, name, order }) {
  return statusEmail({ ...STATUS_EMAIL_COPY.PICKED_UP, email, name, order, status: 'PICKED_UP' })
}

export async function sendOrderWarehouseReceivedEmail({ email, name, order }) {
  return statusEmail({ ...STATUS_EMAIL_COPY.WAREHOUSE_RECEIVED, email, name, order, status: 'WAREHOUSE_RECEIVED' })
}

export async function sendOrderCustomStatusEmail({ email, name, order, status }) {
  return statusEmail({
    email,
    name,
    order,
    status,
    title: `Order update: ${STATUS_LABEL[status] || status}`,
    message: `Your order status has been updated to ${escapeHtml(STATUS_LABEL[status] || status)}.`,
  })
}

export async function sendOrderProcessingEmail({ email, name, order }) {
  return statusEmail({ ...STATUS_EMAIL_COPY.PROCESSING, email, name, order, status: 'PROCESSING' })
}

export async function sendOrderDeliveredEmail({ email, name, order }) {
  return statusEmail({ ...STATUS_EMAIL_COPY.DELIVERED, email, name, order, status: 'DELIVERED' })
}

export async function sendOrderCancelledEmail({ email, name, order }) {
  return statusEmail({ ...STATUS_EMAIL_COPY.CANCELLED, email, name, order, status: 'CANCELLED' })
}

export async function sendOrderReturnedEmail({ email, name, order }) {
  return statusEmail({ ...STATUS_EMAIL_COPY.RETURNED, email, name, order, status: 'RETURNED' })
}

export async function sendOrderRtoEmail({ email, name, order }) {
  return statusEmail({ ...STATUS_EMAIL_COPY.RTO, email, name, order, status: 'RTO' })
}

export async function sendWelcomeEmail(email, name) {
  const subject = 'Welcome to Nilaas'
  const html = emailShell({
    headerTitle: 'Welcome to Nilaas',
    headerSubtitle: 'Indian fashion, made to wear',
    bodyHtml: `
      <p style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:20px;color:${BRAND};">
        Hi ${escapeHtml(name || 'there')},
      </p>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:${BRAND_SOFT};">
        Thank you for joining Nilaas. Your account is ready — explore new styles, save favourites, and checkout with ease.
      </p>
      ${ctaButton(`${APP_URL}/shop`, 'Shop now')}
    `,
  })
  return sendMail({ to: email, subject, html })
}

/** Main order confirmation — Nilaas branded, with product images */
export async function sendOrderConfirmationEmail(orderData) {
  const {
    email,
    name,
    orderId,
    total,
    shippingAddress,
    createdAt,
    paymentMethod,
    shortOrderNumber,
  } = orderData

  const orderItems = await withProductDetails(orderData.orderItems || [])

  const ref = orderRef(
    shortOrderNumber != null
      ? { shortOrderNumber, _id: orderId }
      : orderId
  )
  const placed = createdAt
    ? new Date(createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })
    : ''

  const addr = shippingAddress || {}
  const addressHtml = shippingAddress
    ? cardBox(`
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:16px;color:${BRAND};font-weight:700;margin:0 0 10px;">Shipping address</div>
        <p style="margin:0;font-size:14px;line-height:1.65;color:${BRAND_SOFT};">
          <strong style="color:${BRAND};">${escapeHtml(addr.name || name || '')}</strong><br/>
          ${escapeHtml(addr.street || addr.address || '')}<br/>
          ${escapeHtml([addr.city, addr.state, addr.zip || addr.pincode].filter(Boolean).join(', '))}<br/>
          ${addr.phone || addr.country ? escapeHtml([addr.phone && `Phone: ${addr.phone}`, addr.country].filter(Boolean).join(' · ')) : ''}
        </p>
      `)
    : ''

  const html = emailShell({
    headerTitle: 'Order confirmed',
    headerSubtitle: 'Thank you for your purchase',
    bodyHtml: `
      <p style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:22px;color:${BRAND};">
        Hi ${escapeHtml(name || 'there')},
      </p>
      <p style="margin:0 0 22px;font-size:14px;line-height:1.6;color:${BRAND_SOFT};">
        Your order has been successfully placed and is being processed.
      </p>

      ${cardBox(`
        <div style="font-size:15px;color:${BRAND};"><strong>Order ID:</strong> <span style="font-family:monospace;">${ref}</span></div>
        ${placed ? `<div style="margin-top:6px;font-size:13px;color:${MUTED};">Placed on ${escapeHtml(placed)}</div>` : ''}
      `)}

      <div style="font-family:Georgia,'Times New Roman',serif;font-size:16px;color:${BRAND};font-weight:700;margin:0 0 10px;">
        Order items
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e8e0db;margin:0 0 16px;">
        ${buildItemsRows(orderItems)}
      </table>

      <div style="background:${BRAND};color:#ffffff;text-align:center;padding:16px 18px;margin:0 0 16px;font-size:16px;font-weight:700;">
        Total amount: ${formatInr(total)}
      </div>

      ${cardBox(`
        <div style="text-align:center;font-size:14px;color:${BRAND};">
          <strong>Payment method:</strong> ${escapeHtml(paymentMethod || 'N/A')}
        </div>
      `)}

      ${addressHtml}

      ${ctaButton(`${APP_URL}/orders`, 'Track order')}
    `,
  })

  return sendMail({
    to: email,
    subject: `Order confirmed · ${ref} · Nilaas`,
    html,
  })
}

export async function sendOrderShippedEmail(orderData) {
  const { email, name, orderId, trackingId, trackingUrl, courier, order } = orderData
  const ref = orderRef(order || orderId)
  const trackHref =
    trackingUrl ||
    (trackingId
      ? `https://www.delhivery.com/track/package/${trackingId}`
      : `${APP_URL}/orders`)

  const items = order?.orderItems || []
  const itemsBlock = items.length
    ? `
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:16px;color:${BRAND};font-weight:700;margin:0 0 10px;">
        Items in this shipment
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e8e0db;margin:0 0 16px;">
        ${buildItemsRows(items)}
      </table>`
    : ''

  const html = emailShell({
    headerTitle: 'Your order is on the way',
    headerSubtitle: `Order #${ref}`,
    bodyHtml: `
      <p style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:20px;color:${BRAND};">
        Hi ${escapeHtml(name || 'there')},
      </p>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:${BRAND_SOFT};">
        Great news — your Nilaas order has been shipped.
      </p>

      ${cardBox(`
        <div style="font-size:14px;color:${BRAND};line-height:1.7;">
          ${courier ? `<div><strong>Courier:</strong> ${escapeHtml(courier)}</div>` : ''}
          ${trackingId ? `<div><strong>AWB / Tracking:</strong> <span style="font-family:monospace;">${escapeHtml(trackingId)}</span></div>` : ''}
        </div>
      `)}

      ${itemsBlock}
      ${ctaButton(trackHref, 'Track shipment')}
    `,
  })

  return sendMail({
    to: email,
    subject: `Shipped · ${ref} · Nilaas`,
    html,
  })
}

export async function sendPasswordSetupEmail(email, name) {
  const subject = 'Set up your Nilaas password'
  const html = emailShell({
    headerTitle: 'Set your password',
    headerSubtitle: 'Finish setting up your Nilaas account',
    bodyHtml: `
      <p style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:20px;color:${BRAND};">
        Hi ${escapeHtml(name || 'there')},
      </p>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:${BRAND_SOFT};">
        Please visit Nilaas and sign in to complete your account setup.
      </p>
      ${ctaButton(`${APP_URL}/`, 'Go to Nilaas')}
    `,
  })
  return sendMail({ to: email, subject, html })
}
