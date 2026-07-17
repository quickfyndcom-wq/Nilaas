import authSeller from "@/middlewares/authSeller";
import { NextResponse } from "next/server";
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Order from '@/models/Order';
import AbandonedCart from '@/models/AbandonedCart';

// Get individual customer details with full order history
export async function GET(request, { params }) {
    try {
        await connectDB();
        
        // Firebase Auth
        const authHeader = request.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const idToken = authHeader.split(" ")[1];
        const { getAuth } = await import('firebase-admin/auth');
        const { initializeApp, applicationDefault, getApps } = await import('firebase-admin/app');
        if (getApps().length === 0) {
            initializeApp({ credential: applicationDefault() });
        }
        let decodedToken;
        try {
            decodedToken = await getAuth().verifyIdToken(idToken);
        } catch (e) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = decodedToken.uid;
        const storeId = await authSeller(userId);
        const { customerId } = await params;

        // Get customer information
        const customer = await User.findById(customerId).select('_id name email image').lean();

        if (!customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }

        // Get all orders from this customer for this store
        const orders = await Order.find({
            userId: customerId,
            storeId: storeId
        })
        .populate({
            path: 'orderItems.productId',
            model: 'Product'
        })
        .sort({ createdAt: -1 })
        .lean();

        // Convert orderItems to items format
        const ordersWithItems = orders.map(order => ({
            ...order,
            items: JSON.stringify(order.orderItems.map(item => ({
                name: item.productId?.name || 'Product',
                price: item.price,
                quantity: item.quantity
            })))
        }));

        // Get abandoned cart for this customer (if exists)
        const abandonedCart = await AbandonedCart.findOne({
            userId: customerId,
            storeId: storeId
        }).lean();

        // Calculate statistics
        const totalSpent = ordersWithItems.reduce((sum, order) => sum + order.total, 0);
        const totalOrders = ordersWithItems.length;
        const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

        const customerDetails = {
            ...customer,
            totalOrders,
            totalSpent,
            averageOrderValue: Math.round(averageOrderValue),
            firstOrderDate: ordersWithItems.length > 0 ? ordersWithItems[ordersWithItems.length - 1].createdAt : null,
            lastOrderDate: ordersWithItems.length > 0 ? ordersWithItems[0].createdAt : null,
            orders: ordersWithItems,
            abandonedCart
        };

        return NextResponse.json({ customer: customerDetails });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 });
    }
}
