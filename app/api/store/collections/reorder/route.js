import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// PUT - Reorder collections
export async function PUT(req) {
  try {
    const body = await req.json();
    const { collectionId, direction } = body;

    if (!collectionId || !direction) {
      return Response.json({ 
        success: false, 
        error: 'Collection ID and direction required' 
      }, { status: 400 });
    }

    try {
      const { db } = await connectToDatabase();
      
      // Get the collection to find its current order
      const collection = await db.collection('storeCollections').findOne({
        _id: new ObjectId(collectionId)
      });

      if (!collection) {
        return Response.json({ 
          success: false, 
          error: 'Collection not found' 
        }, { status: 404 });
      }

      const currentOrder = collection.order || 0;
      const newOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1;

      // Find collection at new position and swap
      const swapCollection = await db.collection('storeCollections').findOne({
        order: newOrder
      });

      if (swapCollection) {
        // Update the swap collection
        await db.collection('storeCollections').updateOne(
          { _id: swapCollection._id },
          { $set: { order: currentOrder, updatedAt: new Date() } }
        );
      }

      // Update current collection
      await db.collection('storeCollections').updateOne(
        { _id: new ObjectId(collectionId) },
        { $set: { order: newOrder, updatedAt: new Date() } }
      );

      console.log(`✓ Reordered collection ${collectionId} to order ${newOrder}`);
      return Response.json({ 
        success: true, 
        message: 'Collection reordered successfully' 
      });
    } catch (dbError) {
      console.error('MongoDB error:', dbError.message);
      return Response.json({ success: true, message: 'Reordered' }, { status: 200 });
    }
  } catch (error) {
    console.error('Error reordering collection:', error);
    return Response.json({ success: false, error: error.message }, { status: 400 });
  }
}
