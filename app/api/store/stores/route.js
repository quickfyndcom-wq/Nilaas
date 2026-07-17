import { NextResponse } from "next/server";
import connectDB from '@/lib/mongoose';
import Store from '@/models/Store';

// GET - Fetch all stores (public endpoint for listing)
export async function GET(req) {
    try {
        await connectDB();
        const stores = await Store.find({ isActive: true }).sort({ createdAt: -1 }).lean();
        return NextResponse.json({ stores }, { status: 200 });
    } catch (error) {
        console.error("Error fetching stores:", error);
        return NextResponse.json({ error: "Failed to fetch stores", stores: [] }, { status: 200 });
    }
}
