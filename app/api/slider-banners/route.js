import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import SliderBanner from '@/models/SliderBanner';
import connectDB from '@/lib/mongoose';

export async function GET() {
  try {
    await connectDB();
    const banners = await SliderBanner.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .lean();
    
    return NextResponse.json({
      success: true,
      banners: banners || []
    });
  } catch (error) {
    console.error('Error fetching slider banners:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch banners' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const { title, buttonText, buttonLink, backgroundImage } = await request.json();
    
    // Validation
    if (!title || !buttonLink || !backgroundImage) {
      return NextResponse.json(
        { success: false, error: 'Title, button link, and image are required' },
        { status: 400 }
      );
    }

    const banner = new SliderBanner({
      title,
      buttonText: buttonText || 'Shop Now',
      buttonLink,
      backgroundImage,
      isActive: true,
      order: 0
    });

    await banner.save();

    return NextResponse.json({
      success: true,
      banner,
      message: 'Banner created successfully'
    });
  } catch (error) {
    console.error('Error creating banner:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create banner' },
      { status: 500 }
    );
  }
}
