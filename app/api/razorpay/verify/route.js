import { NextResponse } from 'next/server'
import crypto from 'crypto'
import connectDB from '@/lib/mongodb'
import Order from '@/models/Order'
import User from '@/models/User'
import { sendOrderConfirmationEmail } from '@/lib/email'

export async function POST(request) {
  try {
    await connectDB()

    const body = await request.json()
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderIds = [],
    } = body || {}

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment details' }, { status: 400 })
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET
    if (!keySecret) {
      return NextResponse.json({ error: 'Razorpay is not configured' }, { status: 500 })
    }

    const expected = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    if (expected !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    const query =
      Array.isArray(orderIds) && orderIds.length > 0
        ? { _id: { $in: orderIds }, razorpayOrderId: razorpay_order_id }
        : { razorpayOrderId: razorpay_order_id }

    const orders = await Order.find(query)
    if (!orders.length) {
      return NextResponse.json({ error: 'Order not found for this payment' }, { status: 404 })
    }

    for (const order of orders) {
      if (order.isPaid) continue

      order.isPaid = true
      order.paymentStatus = 'paid'
      order.razorpayPaymentId = razorpay_payment_id
      order.razorpaySignature = razorpay_signature
      if (order.status === 'ORDER_PLACED' || !order.status) {
        order.status = 'ORDER_PLACED'
      }
      await order.save()

      try {
        let customerEmail = order.guestEmail || order.shippingAddress?.email || ''
        let customerName = order.guestName || order.shippingAddress?.name || ''

        if (!customerEmail && order.userId) {
          const user = await User.findById(order.userId).lean()
          customerEmail = user?.email || ''
          customerName = customerName || user?.name || ''
        }

        if (customerEmail) {
          const populated = await Order.findById(order._id)
            .populate({ path: 'orderItems.productId', select: 'name images price' })
            .lean()
          await sendOrderConfirmationEmail({
            email: customerEmail,
            name: customerName,
            orderId: order._id,
            shortOrderNumber: order.shortOrderNumber,
            total: order.total,
            orderItems: populated?.orderItems || order.orderItems,
            shippingAddress: order.shippingAddress,
            createdAt: order.createdAt,
            paymentMethod: 'RAZORPAY',
          })
        }
      } catch (emailError) {
        console.error('Razorpay verify email error:', emailError?.message || emailError)
      }

      if (order.userId) {
        try {
          await User.findByIdAndUpdate(order.userId, { cart: {} })
        } catch {}
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified',
      id: orders[0]._id.toString(),
      orderIds: orders.map((o) => o._id.toString()),
    })
  } catch (error) {
    console.error('Razorpay verify failed:', error?.message || error)
    return NextResponse.json({ error: error.message || 'Verification failed' }, { status: 400 })
  }
}
