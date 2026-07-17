import { connectToDatabase } from '@/lib/mongodb';

// GET - Fetch public banners for a store (no auth required)
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const storeParam = searchParams.get('store');

    if (!storeParam) {
      return Response.json({ success: false, error: 'Store parameter required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Find store by username or ID
    const store = await db.collection('stores').findOne({
      $or: [
        { username: storeParam },
        { name: storeParam }
      ]
    });

    if (!store) {
      return Response.json({ success: false, error: 'Store not found' }, { status: 404 });
    }

    // Fetch active banners for this store
    const banners = await db.collection('storeBanners')
      .find({ 
        storeId: store._id.toString(),
        isActive: true
      })
      .sort({ order: 1, createdAt: -1 })
      .toArray();

    return Response.json({ success: true, banners: banners || [] });
  } catch (error) {
    console.error('Error fetching public banners:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
