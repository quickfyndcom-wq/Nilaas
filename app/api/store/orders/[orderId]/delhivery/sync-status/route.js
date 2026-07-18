import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Order from '@/models/Order'
import authSeller from '@/middlewares/authSeller'
import { trackWaybill } from '@/lib/delhivery'
import { extractDelhiveryStatus, mapDelhiveryStatusToOrder } from '@/lib/order-status'

async function getSellerStoreId(request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  const idToken = authHeader.split(' ')[1]
  const { getAuth } = await import('firebase-admin/auth')
  const { initializeApp, getApps, cert } = await import('firebase-admin/app')
  if (getApps().length === 0) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}')
    initializeApp({ credential: cert(serviceAccount) })
  }
  const decoded = await getAuth().verifyIdToken(idToken)
  const storeId = await authSeller(decoded.uid)
  if (!storeId) {
    return { error: NextResponse.json({ error: 'Not a seller' }, { status: 403 }) }
  }
  return { storeId }
}

/** POST — pull latest Delhivery scan status and update order (+ email customer). */
export async function POST(request, { params }) {
  try {
    await connectDB()
    const auth = await getSellerStoreId(request)
    if (auth.error) return auth.error

    const { orderId } = await params
    const body = await request.json().catch(() => ({}))
    const notify = body.notify !== false

    const order = await Order.findOne({ _id: orderId, storeId: auth.storeId })
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const waybill = order.delhiveryWaybill || (order.courier === 'Delhivery' ? order.trackingId : null)
    if (!waybill) {
      return NextResponse.json(
        { error: 'No Delhivery AWB on this order. Ship or link AWB first.' },
        { status: 400 }
      )
    }

    const trackData = await trackWaybill(waybill)
    const delhiveryStatus = extractDelhiveryStatus(trackData)
    const mapped = mapDelhiveryStatusToOrder(delhiveryStatus)

    if (!mapped) {
      return NextResponse.json({
        success: false,
        error: 'Could not map Delhivery status',
        delhiveryStatus,
        waybill,
        raw: trackData,
      }, { status: 422 })
    }

    const previous = order.status
    order.status = mapped
    order.delhiveryLastStatus = delhiveryStatus
    order.delhiveryLastSyncedAt = new Date()
    if (mapped === 'DELIVERED' && !order.deliveredAt) order.deliveredAt = new Date()
    await order.save()

    let email = { sent: false, reason: 'skipped' }
    if (notify && previous !== mapped) {
      try {
        const { sendOrderStatusEmail } = await import('@/lib/email')
        email = await sendOrderStatusEmail(order, mapped)
      } catch (e) {
        email = { sent: false, reason: e.message }
      }
    }

    return NextResponse.json({
      success: true,
      waybill,
      delhiveryStatus,
      previousStatus: previous,
      status: mapped,
      email,
      order: {
        _id: order._id,
        status: order.status,
        delhiveryLastStatus: order.delhiveryLastStatus,
        delhiveryLastSyncedAt: order.delhiveryLastSyncedAt,
      },
    })
  } catch (error) {
    console.error('Delhivery sync-status error:', error?.response?.data || error.message || error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync status from Delhivery' },
      { status: 500 }
    )
  }
}
