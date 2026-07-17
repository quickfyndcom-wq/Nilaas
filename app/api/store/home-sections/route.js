import { NextResponse } from "next/server";
import connectDB from '@/lib/mongoose';
import HomeSection from '@/models/HomeSection';

// GET - Fetch all home sections (public endpoint)
export async function GET(req) {
    try {
        await connectDB();
        const sections = await HomeSection.find({}).sort({ order: 1 }).lean();
        return NextResponse.json({ sections }, { status: 200 });
    } catch (error) {
        console.error("Error fetching home sections:", error);
        return NextResponse.json({ error: "Failed to fetch sections", sections: [] }, { status: 200 });
    }
}

// POST - Create or update home sections (requires authentication)
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
        await HomeSection.deleteMany({});
        if (sections.length > 0) {
            await HomeSection.insertMany(sections);
        }
        
        return NextResponse.json({ message: "Sections updated successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error updating home sections:", error);
        return NextResponse.json({ error: "Failed to update sections" }, { status: 500 });
    }
}
