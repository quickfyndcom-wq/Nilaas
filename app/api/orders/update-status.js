import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import { sendOrderStatusEmail } from '@/lib/email';

export async function POST(req) {
  try {
    await connectDB();
    const { orderId, status } = await req.json();
    console.log('[update-status] Received:', { orderId, status });
    if (!orderId || !status) {
      console.log('[update-status] Missing orderId or status');
      return NextResponse.json({ success: false, error: 'Order ID and status are required' }, { status: 400 });
    }
    const order = await Order.findById(orderId);
    if (!order) {
      console.log('[update-status] Order not found:', orderId);
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }
    const { ORDER_STATUS_VALUES } = await import('@/lib/orderNumber');
    if (!ORDER_STATUS_VALUES.includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
    }

    order.status = status;
    await order.save();

    let emailInfo = { sent: false, reason: 'not attempted' };
    try {
      emailInfo = await sendOrderStatusEmail(order, status);
      console.log('[update-status] Email send result:', emailInfo);
    } catch (emailError) {
      console.error('[update-status] Email sending failed:', emailError);
      emailInfo = { sent: false, reason: emailError.message || 'Email send failed' };
    }

    return NextResponse.json({
      success: true,
      message: emailInfo.sent
        ? `Order status updated — email sent to ${emailInfo.to}`
        : `Order status updated — email not sent (${emailInfo.reason || 'no email'})`,
      email: emailInfo,
      order,
    });
  } catch (error) {
    console.error('Order status update error:', error);
    return NextResponse.json({ success: false, error: error?.message || error }, { status: 500 });
  }
}
