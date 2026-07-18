import connectDB from "@/lib/mongoose";
import Product from "@/models/Product";
import { NextResponse } from "next/server";

export async function GET(request) {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    if (!slug) {
        return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }
    const product = await Product.findOne({ slug })
        .select('-__v')
        .lean();
    if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json({ product });
}
