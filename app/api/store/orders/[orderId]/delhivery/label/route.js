import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Order from '@/models/Order'
import authSeller from '@/middlewares/authSeller'
import { getPackingSlip, getPackingSlipPdf } from '@/lib/delhivery'
import { buildSingleLabelPdf } from '@/lib/delhivery-label-pdf'

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

export async function GET(request, { params }) {
  try {
    await connectDB()
    const auth = await getSellerStoreId(request)
    if (auth.error) return auth.error

    const { orderId } = await params
    const order = await Order.findOne({ _id: orderId, storeId: auth.storeId }).populate({
      path: 'orderItems.productId',
      select: 'name',
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const waybill = order.delhiveryWaybill || order.trackingId
    if (!waybill) {
      return NextResponse.json(
        { error: 'No Delhivery AWB on this order. Ship with Delhivery first.' },
        { status: 400 }
      )
    }

    // Prefer Delhivery's official packing-slip PDF when available
    const officialPdf = await getPackingSlipPdf(waybill)
    if (officialPdf) {
      return new NextResponse(officialPdf, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="Delhivery-Label-${waybill}.pdf"`,
        },
      })
    }

    let slip = null
    try {
      slip = await getPackingSlip(waybill)
    } catch (e) {
      console.warn('Packing slip fetch failed, generating local label:', e.message)
    }

    const pdf = await buildSingleLabelPdf({ order, waybill, slip })

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Delhivery-Label-${waybill}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Delhivery label error:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate AWB' }, { status: 500 })
  }
}
