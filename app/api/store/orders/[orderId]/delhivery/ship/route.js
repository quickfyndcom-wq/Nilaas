import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Order from '@/models/Order'
import authSeller from '@/middlewares/authSeller'
import { createShipment } from '@/lib/delhivery'
import { ensureShortOrderNumber } from '@/lib/orderNumber'

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
  return { storeId, uid: decoded.uid }
}

export async function POST(request, { params }) {
  try {
    await connectDB()
    const auth = await getSellerStoreId(request)
    if (auth.error) return auth.error

    const { orderId } = await params
    const body = await request.json().catch(() => ({}))

    const order = await Order.findOne({ _id: orderId, storeId: auth.storeId }).populate({
      path: 'orderItems.productId',
      select: 'name',
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.delhiveryWaybill || order.trackingId) {
      return NextResponse.json(
        {
          error: 'Shipment already created',
          waybill: order.delhiveryWaybill || order.trackingId,
          trackingUrl: order.trackingUrl,
        },
        { status: 400 }
      )
    }

    if (!order.shippingAddress?.street && !order.shippingAddress?.address) {
      return NextResponse.json(
        { error: 'Order has no shipping address — cannot ship with Delhivery' },
        { status: 400 }
      )
    }

    // Persist the same order number that will be sent to Delhivery
    ensureShortOrderNumber(order)

    const result = await createShipment({
      order,
      pickupName: body.pickupName || process.env.DELHIVERY_PICKUP_NAME,
    })

    if (!result.waybill) {
      return NextResponse.json(
        {
          error: result.message || 'Delhivery did not return a waybill',
          raw: result.raw,
        },
        { status: 400 }
      )
    }

    order.delhiveryWaybill = result.waybill
    order.delhiveryOrderRef = result.orderRef
    order.delhiveryRaw = result.raw
    order.trackingId = result.waybill
    order.trackingUrl = result.trackingUrl
    order.courier = 'Delhivery'
    order.status = 'MANIFESTED'
    order.shippedAt = new Date()
    order.delhiveryLastStatus = 'Manifested'
    order.delhiveryLastSyncedAt = new Date()
    await order.save()

    // Notify customer of manifested / shipped status
    try {
      const { sendOrderStatusEmail } = await import('@/lib/email')
      await sendOrderStatusEmail(order, 'MANIFESTED')
    } catch (e) {
      console.warn('Manifest email failed:', e.message)
    }

    return NextResponse.json({
      success: true,
      message: 'Manifested with Delhivery',
      waybill: result.waybill,
      trackingUrl: result.trackingUrl,
      order: {
        _id: order._id,
        status: order.status,
        trackingId: order.trackingId,
        trackingUrl: order.trackingUrl,
        courier: order.courier,
        delhiveryWaybill: order.delhiveryWaybill,
      },
    })
  } catch (error) {
    console.error('Delhivery ship error:', error?.response?.data || error.message || error)
    const msg =
      error?.response?.data?.rmk ||
      error?.response?.data?.remark ||
      error?.response?.data?.error ||
      error.message ||
      'Failed to create Delhivery shipment'
    return NextResponse.json(
      { error: typeof msg === 'string' ? msg : JSON.stringify(msg), details: error?.response?.data },
      { status: 400 }
    )
  }
}
