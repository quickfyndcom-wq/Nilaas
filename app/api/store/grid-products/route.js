import { NextResponse } from "next/server";
import connectDB from '@/lib/mongoose';
import GridProduct from '@/models/GridProduct';

// GET - Fetch all grid products (public endpoint)
export async function GET(req) {
    try {
        await connectDB();
        const sections = await GridProduct.find({}).sort({ order: 1 }).lean();
        return NextResponse.json({ sections }, { status: 200 });
    } catch (error) {
        console.error("Error fetching grid products:", error);
        return NextResponse.json({ error: "Failed to fetch grid products", sections: [] }, { status: 200 });
    }
}

// POST - Create or update grid products (requires authentication)
export async function POST(req) {
    try {
        await connectDB();
        
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        
        const body = await req.json();
        const { sections } = body;
        
        if (!Array.isArray(sections)) {
            return NextResponse.json({ error: "Invalid sections data" }, { status: 400 });
        }
        
        // Clear existing and insert new
        await GridProduct.deleteMany({});
        if (sections.length > 0) {
            await GridProduct.insertMany(sections);
        }
        
        return NextResponse.json({ message: "Grid products updated successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error updating grid products:", error);
        return NextResponse.json({ error: "Failed to update grid products" }, { status: 500 });
    }
}
