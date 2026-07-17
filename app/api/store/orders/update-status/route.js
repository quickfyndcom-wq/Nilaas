import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import authSeller from '@/middlewares/authSeller';
import { getAuth } from '@/lib/firebase-admin';

export async function POST(request) {
    try {
        // Authenticate user
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
        }

        const idToken = authHeader.split(' ')[1];
        let decodedToken;
        try {
            decodedToken = await getAuth().verifyIdToken(idToken);
        } catch (err) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
        }

        const userId = decodedToken.uid;

        // Check if user is a seller
        const storeId = await authSeller(userId);
        if (!storeId) {
            return NextResponse.json({ error: 'Unauthorized - not a seller' }, { status: 403 });
        }

        // Get request body
        const { orderId, status } = await request.json();

        if (!orderId || !status) {
            return NextResponse.json({ error: 'Missing orderId or status' }, { status: 400 });
        }

        // Validate status
        const { ORDER_STATUS_VALUES } = await import('@/lib/orderNumber');
        const aliases = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'canceled', 'rto', 'return_requested', 'returned'];
        const validStatuses = [...ORDER_STATUS_VALUES, ...aliases];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        const statusMap = {
            pending: 'ORDER_PLACED',
            processing: 'PROCESSING',
            shipped: 'SHIPPED',
            delivered: 'DELIVERED',
            cancelled: 'CANCELLED',
            canceled: 'CANCELLED',
            rto: 'RTO',
            return_requested: 'RETURN_REQUESTED',
            returned: 'RETURNED',
        };
        const normalizedStatus = statusMap[status] || status;

        // Connect to database
        await dbConnect();

        // Find and update order
        const order = await Order.findById(orderId);
        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Verify that this order belongs to the seller's store
        // Check storeId at order level or in items
        const orderStoreId = order.storeId ? order.storeId.toString() : null;
        const orderItems = order.items || [];
        const itemStoreIds = orderItems.map(item => item.storeId?.toString()).filter(Boolean);
        
        const belongsToStore = orderStoreId === storeId.toString() || 
                              itemStoreIds.includes(storeId.toString());

        if (!belongsToStore) {
            console.log('[update-status] Order storeId:', orderStoreId);
            console.log('[update-status] Item storeIds:', itemStoreIds);
            console.log('[update-status] Seller storeId:', storeId);
            return NextResponse.json({ error: 'Unauthorized - order does not belong to your store' }, { status: 403 });
        }

        // Update order status
        order.status = normalizedStatus;
        await order.save();

        // Send status update email to customer (every status has a template)
        let emailInfo = { sent: false, reason: 'not attempted' };
        try {
            const { sendOrderStatusEmail } = await import('@/lib/email');
            emailInfo = await sendOrderStatusEmail(order, normalizedStatus);
            console.log('[store/update-status] Email send result:', emailInfo);
        } catch (emailError) {
            console.error('[store/update-status] Email sending failed:', emailError);
            emailInfo = { sent: false, reason: emailError.message || 'Email send failed' };
        }

        return NextResponse.json({ 
            success: true, 
            message: emailInfo.sent
                ? `Order status updated — email sent to ${emailInfo.to}`
                : `Order status updated — email not sent (${emailInfo.reason || 'no email'})`,
            email: emailInfo,
            order: {
                _id: order._id,
                status: order.status
            }
        });

    } catch (error) {
        console.error('[update-status API] Error:', error);
        return NextResponse.json({ 
            error: 'Failed to update order status',
            message: error.message 
        }, { status: 500 });
    }
}
