import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongoose'
import Order from '@/models/Order'

/**
 * Mark Razorpay orders as payment failed / cancelled when checkout is dismissed
 * or the card payment fails (so dashboard does not show them as Order Placed).
 */
export async function POST(request) {
  try {
    await connectDB()

    const body = await request.json()
    const { orderIds = [], razorpayOrderId, reason = 'Payment failed or cancelled' } = body || {}

    if ((!Array.isArray(orderIds) || orderIds.length === 0) && !razorpayOrderId) {
      return NextResponse.json({ error: 'orderIds or razorpayOrderId required' }, { status: 400 })
    }

    const query = {
      isPaid: { $ne: true },
      paymentMethod: 'RAZORPAY',
      ...(Array.isArray(orderIds) && orderIds.length > 0
        ? { _id: { $in: orderIds } }
        : {}),
      ...(razorpayOrderId ? { razorpayOrderId } : {}),
    }

    const result = await Order.updateMany(query, {
      $set: {
        paymentStatus: 'failed',
        isPaid: false,
        status: 'PAYMENT_FAILED',
        paymentFailureReason: String(reason).slice(0, 300),
        paymentFailedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      matched: result.matchedCount ?? result.n,
      modified: result.modifiedCount ?? result.nModified,
    })
  } catch (error) {
    console.error('Razorpay fail mark error:', error?.message || error)
    return NextResponse.json({ error: error.message || 'Failed to update payment status' }, { status: 400 })
  }
}
