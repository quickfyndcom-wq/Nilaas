import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Order from '@/models/Order'
import authSeller from '@/middlewares/authSeller'
import { getPackingSlip, getPackingSlipPdf } from '@/lib/delhivery'
import { buildBulkLabelsPdf } from '@/lib/delhivery-label-pdf'

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

/** POST { orderIds: string[] } → A4 PDF, 4 AWB labels per page */
export async function POST(request) {
  try {
    await connectDB()
    const auth = await getSellerStoreId(request)
    if (auth.error) return auth.error

    const body = await request.json().catch(() => ({}))
    const orderIds = Array.isArray(body.orderIds)
      ? body.orderIds.map((id) => String(id)).filter(Boolean)
      : []

    if (orderIds.length === 0) {
      return NextResponse.json({ error: 'Select at least one order' }, { status: 400 })
    }
    if (orderIds.length > 40) {
      return NextResponse.json({ error: 'Maximum 40 labels per download' }, { status: 400 })
    }

    const orders = await Order.find({
      _id: { $in: orderIds },
      storeId: auth.storeId,
    }).populate({
      path: 'orderItems.productId',
      select: 'name',
    })

    const byId = new Map(orders.map((o) => [String(o._id), o]))
    const items = []

    for (const id of orderIds) {
      const order = byId.get(String(id))
      if (!order) continue
      const waybill = order.delhiveryWaybill || (order.courier === 'Delhivery' ? order.trackingId : null)
      if (!waybill) continue
      items.push({ order, waybill })
    }

    if (items.length === 0) {
      return NextResponse.json(
        { error: 'None of the selected orders have a Delhivery AWB' },
        { status: 400 }
      )
    }

    // Prefer official Delhivery packing-slip PDF(s) for these AWBs
    const officialPdf = await getPackingSlipPdf(items.map((i) => i.waybill))
    if (officialPdf) {
      return new NextResponse(officialPdf, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="Delhivery-AWB-Labels-${items.length}.pdf"`,
        },
      })
    }

    // Fallback: local render from packing-slip JSON
    for (const item of items) {
      try {
        item.slip = await getPackingSlip(item.waybill)
      } catch {
        item.slip = null
      }
    }

    const pdf = await buildBulkLabelsPdf(items)

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Delhivery-AWB-Labels-${items.length}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Bulk AWB labels error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate labels' },
      { status: 500 }
    )
  }
}
