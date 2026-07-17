import { NextResponse } from "next/server";
import connectDB from '@/lib/mongoose';
import Section4 from '@/models/Section4';

// GET - Fetch all section4 items (public endpoint)
export async function GET(req) {
    try {
        await connectDB();
        const sections = await Section4.find({}).sort({ order: 1 }).lean();
        return NextResponse.json({ sections }, { status: 200 });
    } catch (error) {
        console.error("Error fetching section4:", error);
        return NextResponse.json({ error: "Failed to fetch section4", sections: [] }, { status: 200 });
    }
}

// POST - Create or update section4 (requires authentication)
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
        await Section4.deleteMany({});
        if (sections.length > 0) {
            await Section4.insertMany(sections);
        }
        
        return NextResponse.json({ message: "Section4 updated successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error updating section4:", error);
        return NextResponse.json({ error: "Failed to update section4" }, { status: 500 });
    }
}
