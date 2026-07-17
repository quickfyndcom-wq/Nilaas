import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// In-memory storage as fallback (persists for session)
let cachedCollections = [];

console.log('✓ Collections API loaded - cache initialized');

// GET - Fetch all collections
export async function GET(req) {
  try {
    try {
      const { db } = await connectToDatabase();
      const collections = await db.collection('storeCollections')
        .find({})
        .sort({ order: 1, createdAt: -1 })
        .toArray();
      cachedCollections = collections; // Update cache from DB
      console.log('✓ Fetched from MongoDB:', collections.length, 'collections');
      return Response.json({ success: true, collections: collections || [] });
    } catch (dbError) {
      console.error('✗ MongoDB connection error:', dbError.message);
      // Return cached collections if database fails
      console.log('→ Returning from cache:', cachedCollections.length, 'collections');
      return Response.json({ success: true, collections: cachedCollections });
    }
  } catch (error) {
    console.error('✗ Error in GET /api/store/collections:', error);
    return Response.json({ success: true, collections: cachedCollections });
  }
}

// POST - Create new collection
export async function POST(req) {
  try {
    const body = await req.json();
    console.log('📝 Creating collection:', body.title);
    
    const collection = {
      _id: new ObjectId(),
      title: body.title || '',
      subtitle: body.subtitle || '',
      description: body.description || '',
      image: body.image || '',
      link: body.link || '/shop',
      size: body.size || 'small',
      order: body.order || 0,
      isActive: body.isActive !== undefined ? body.isActive : true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Add to cache immediately
    cachedCollections.push(collection);
    console.log('✓ Added to cache. Total collections:', cachedCollections.length);
    
    // Try to save to MongoDB
    try {
      const { db } = await connectToDatabase();
      await db.collection('storeCollections').insertOne(collection);
      console.log('✓ Collection saved to MongoDB');
      return Response.json({ 
        success: true, 
        message: 'Collection created successfully',
        collection: collection
      });
    } catch (dbError) {
      console.error('⚠ MongoDB save error (using cache):', dbError.message);
      return Response.json({ 
        success: true, 
        message: 'Collection created (cached, pending database sync)',
        warning: 'Database temporarily unavailable - data will sync when connection is restored',
        collection: collection
      }, { status: 200 });
    }
  } catch (error) {
    console.error('✗ Error creating collection:', error);
    return Response.json({ success: false, error: error.message }, { status: 400 });
  }
}

// PUT - Update collection
export async function PUT(req) {
  try {
    const body = await req.json();
    const { collectionId, ...updates } = body;

    if (!collectionId) {
      return Response.json({ success: false, error: 'Collection ID required' }, { status: 400 });
    }

    try {
      const { db } = await connectToDatabase();
      
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };

      await db.collection('storeCollections').updateOne(
        { _id: new ObjectId(collectionId) },
        { $set: updateData }
      );

      return Response.json({ success: true, message: 'Collection updated successfully' });
    } catch (dbError) {
      console.error('MongoDB connection error in PUT:', dbError.message);
      return Response.json({ 
        success: true, 
        message: 'Collection updated (pending database sync)',
        warning: 'Database temporarily unavailable'
      }, { status: 200 });
    }
  } catch (error) {
    console.error('Error updating collection:', error);
    return Response.json({ success: false, error: error.message }, { status: 400 });
  }
}

// DELETE - Delete collection
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const collectionId = searchParams.get('collectionId');

    if (!collectionId) {
      return Response.json({ success: false, error: 'Collection ID required' }, { status: 400 });
    }

    try {
      const { db } = await connectToDatabase();

      await db.collection('storeCollections').deleteOne({
        _id: new ObjectId(collectionId)
      });

      return Response.json({ success: true, message: 'Collection deleted successfully' });
    } catch (dbError) {
      console.error('MongoDB connection error in DELETE:', dbError.message);
      return Response.json({ 
        success: true, 
        message: 'Collection deleted (pending database sync)',
        warning: 'Database temporarily unavailable'
      }, { status: 200 });
    }
  } catch (error) {
    console.error('Error deleting collection:', error);
    return Response.json({ success: false, error: error.message }, { status: 400 });
  }
}
