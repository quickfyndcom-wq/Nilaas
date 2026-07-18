import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Order from '@/models/Order'
import { trackWaybill } from '@/lib/delhivery'
import { extractDelhiveryTrackingDetails } from '@/lib/order-status'

async function emailMatchesOrder(order, email) {
  if (!email) return true
  const normalized = email.trim().toLowerCase()
  const candidates = [
    order.guestEmail,
    order.email,
    order.shippingAddress?.email,
  ]
    .filter(Boolean)
    .map((e) => String(e).toLowerCase())

  if (candidates.includes(normalized)) return true

  // Logged-in customer: resolve User email
  if (order.userId && order.userId !== 'guest') {
    try {
      const User = (await import('@/models/User')).default
      const user = await User.findById(order.userId).select('email').lean()
      if (user?.email && String(user.email).toLowerCase() === normalized) return true
    } catch {
      // ignore
    }
  }
  return false
}

async function findOrder(awb) {
  const awbTrim = String(awb || '').trim()
  if (!awbTrim) return null

  const populate = { path: 'orderItems.productId', select: 'name images price slug' }

  // AWB / tracking id
  let order = await Order.findOne({
    $or: [
      { trackingId: awbTrim },
      { delhiveryWaybill: awbTrim },
    ],
  })
    .populate(populate)
    .sort({ createdAt: -1 })
    .lean()

  if (!order && /^[a-fA-F0-9]{24}$/.test(awbTrim)) {
    order = await Order.findOne({ _id: awbTrim }).populate(populate).lean()
  }

  if (!order && /^\d+$/.test(awbTrim)) {
    order = await Order.findOne({ shortOrderNumber: Number(awbTrim) })
      .populate(populate)
      .lean()
  }

  return order
}

export async function GET(req) {
  try {
    await connectDB()

    const { searchParams } = new URL(req.url)
    const phone = searchParams.get('phone')
    const awb = searchParams.get('awb') || searchParams.get('orderId')
    const email = searchParams.get('email')

    if (!awb && !phone && !email) {
      return NextResponse.json(
        { success: false, message: 'Email and Order Number / AWB are required' },
        { status: 400 }
      )
    }

    let order = awb ? await findOrder(awb) : null

    if (!order && phone) {
      order = await Order.findOne({ 'shippingAddress.phone': phone.trim() })
        .populate({ path: 'orderItems.productId', select: 'name images price slug' })
        .sort({ createdAt: -1 })
        .lean()
    }

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found with the provided information' },
        { status: 404 }
      )
    }

    if (email && !(await emailMatchesOrder(order, email))) {
      return NextResponse.json(
        { success: false, message: 'Email does not match the order' },
        { status: 404 }
      )
    }

    const waybill =
      order.delhiveryWaybill ||
      (order.courier === 'Delhivery' ? order.trackingId : null) ||
      order.trackingId ||
      null

    let delhivery = null
    if (waybill && process.env.DELHIVERY_API_TOKEN) {
      try {
        const trackData = await trackWaybill(waybill)
        delhivery = extractDelhiveryTrackingDetails(trackData)

        // Keep store order status in sync with live courier (best effort)
        if (delhivery?.mappedStatus && delhivery.mappedStatus !== order.status) {
          await Order.updateOne(
            { _id: order._id },
            {
              $set: {
                status: delhivery.mappedStatus,
                delhiveryLastStatus: delhivery.status,
                delhiveryLastSyncedAt: new Date(),
                ...(delhivery.mappedStatus === 'DELIVERED' ? { deliveredAt: new Date() } : {}),
              },
            }
          )
          order = { ...order, status: delhivery.mappedStatus, delhiveryLastStatus: delhivery.status }
        }
      } catch (e) {
        console.warn('[track-order] Delhivery live track failed:', e.message)
        delhivery = {
          error: 'Live courier tracking temporarily unavailable',
          status: order.delhiveryLastStatus || null,
          scans: [],
        }
      }
    }

    const trackingUrl =
      order.trackingUrl ||
      (waybill ? `https://www.delhivery.com/track/package/${waybill}` : null)

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        trackingId: waybill || order.trackingId,
        trackingUrl,
        courier: order.courier || (waybill ? 'Delhivery' : order.courier),
      },
      delhivery,
    })
  } catch (error) {
    console.error('Track order error:', error?.stack || error)
    return NextResponse.json(
      { success: false, message: 'Failed to track order', error: error?.message || error },
      { status: 500 }
    )
  }
}
