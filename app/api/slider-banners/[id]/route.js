import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import SliderBanner from '@/models/SliderBanner';
import connectDB from '@/lib/mongoose';

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { id } = params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid banner ID' },
        { status: 400 }
      );
    }

    const result = await SliderBanner.findByIdAndDelete(id);
    
    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Banner not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Banner deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting banner:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete banner' },
      { status: 500 }
    );
  }
}
