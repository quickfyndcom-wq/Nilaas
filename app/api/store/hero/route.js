import { NextResponse } from "next/server";
import connectDB from '@/lib/mongoose';
import HeroBanner from '@/models/HeroBanner';

// GET - Fetch hero banners (public endpoint)
export async function GET(req) {
    try {
        await connectDB();
        const banners = await HeroBanner.find({}).sort({ order: 1 }).lean();
        return NextResponse.json({ banners }, { status: 200 });
    } catch (error) {
        console.error("Error fetching hero banners:", error);
        return NextResponse.json({ error: "Failed to fetch banners", banners: [] }, { status: 200 });
    }
}

// POST - Create or update hero banners (requires authentication)
export async function POST(req) {
    try {
        await connectDB();
        
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        
        const body = await req.json();
        const { slides } = body;
        
        if (!Array.isArray(slides)) {
            return NextResponse.json({ error: "Invalid slides data" }, { status: 400 });
        }
        
        // Clear existing and insert new
        await HeroBanner.deleteMany({});
        if (slides.length > 0) {
            await HeroBanner.insertMany(slides);
        }
        
        return NextResponse.json({ message: "Hero banners updated successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error updating hero banners:", error);
        return NextResponse.json({ error: "Failed to update banners" }, { status: 500 });
    }
}
