import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Order from '@/models/Order'
import authSeller from '@/middlewares/authSeller'

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

/** Link an existing Delhivery AWB (e.g. created in Delhivery panel) to this order */
export async function POST(request, { params }) {
  try {
    await connectDB()
    const auth = await getSellerStoreId(request)
    if (auth.error) return auth.error

    const { orderId } = await params
    const { waybill } = await request.json()
    const awb = String(waybill || '').trim()
    if (!awb) {
      return NextResponse.json({ error: 'AWB / waybill is required' }, { status: 400 })
    }

    const order = await Order.findOne({ _id: orderId, storeId: auth.storeId })
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    order.delhiveryWaybill = awb
    order.trackingId = awb
    order.courier = 'Delhivery'
    order.trackingUrl = `https://www.delhivery.com/track/package/${awb}`
    if (!order.shippedAt) order.shippedAt = new Date()
    if (['ORDER_PLACED', 'CONFIRMED', 'PROCESSING'].includes(order.status)) {
      order.status = 'MANIFESTED'
    }
    order.delhiveryLastStatus = 'Linked AWB'
    order.delhiveryLastSyncedAt = new Date()
    await order.save()

    return NextResponse.json({
      success: true,
      waybill: awb,
      order: {
        _id: order._id,
        delhiveryWaybill: order.delhiveryWaybill,
        trackingId: order.trackingId,
        trackingUrl: order.trackingUrl,
        courier: order.courier,
        status: order.status,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to link AWB' }, { status: 400 })
  }
}
