import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Order from '@/models/Order'
import authSeller from '@/middlewares/authSeller'
import { createPickupRequest } from '@/lib/delhivery'

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

export async function POST(request, { params }) {
  try {
    await connectDB()
    const auth = await getSellerStoreId(request)
    if (auth.error) return auth.error

    const { orderId } = await params
    const body = await request.json().catch(() => ({}))
    const { pickupDate, pickupTime, expectedPackageCount } = body

    if (!pickupDate) {
      return NextResponse.json({ error: 'Please choose a pickup date' }, { status: 400 })
    }

    const order = await Order.findOne({ _id: orderId, storeId: auth.storeId })
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const waybill = order.delhiveryWaybill || order.trackingId
    if (!waybill) {
      return NextResponse.json(
        { error: 'Create Delhivery AWB first, then schedule pickup' },
        { status: 400 }
      )
    }

    const result = await createPickupRequest({
      pickupDate,
      pickupTime: pickupTime || '14:00:00',
      expectedPackageCount: expectedPackageCount || 1,
      pickupLocation: body.pickupLocation || process.env.DELHIVERY_PICKUP_NAME,
    })

    order.delhiveryPickupId = result.pickupId
    order.delhiveryPickupDate = result.pickupDate
    order.delhiveryPickupTime = result.pickupTime
    order.delhiveryPickupRaw = result.raw
    if (
      ['ORDER_PLACED', 'CONFIRMED', 'PROCESSING', 'MANIFESTED', 'SHIPPED'].includes(order.status)
    ) {
      order.status = 'PICKUP_REQUESTED'
    }
    await order.save()

    try {
      const { sendOrderStatusEmail } = await import('@/lib/email')
      await sendOrderStatusEmail(order, order.status)
    } catch (e) {
      console.warn('Pickup status email failed:', e.message)
    }

    return NextResponse.json({
      success: true,
      message: `Pickup scheduled for ${result.pickupDate} at ${result.pickupTime}`,
      pickupId: result.pickupId,
      pickupDate: result.pickupDate,
      pickupTime: result.pickupTime,
      waybill,
      order: {
        _id: order._id,
        delhiveryPickupId: order.delhiveryPickupId,
        delhiveryPickupDate: order.delhiveryPickupDate,
        delhiveryPickupTime: order.delhiveryPickupTime,
        status: order.status,
      },
    })
  } catch (error) {
    console.error('Delhivery pickup error:', error?.response?.data || error.message || error)
    const msg =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.response?.data?.detail ||
      error.message ||
      'Failed to schedule pickup'
    return NextResponse.json(
      { error: typeof msg === 'string' ? msg : JSON.stringify(msg), details: error?.response?.data },
      { status: 400 }
    )
  }
}
