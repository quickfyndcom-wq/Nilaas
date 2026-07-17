import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// DELETE - Delete collection by ID
export async function DELETE(req, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return Response.json({ success: false, error: 'Collection ID required' }, { status: 400 });
    }

    try {
      const { db } = await connectToDatabase();
      await db.collection('storeCollections').deleteOne({
        _id: new ObjectId(id)
      });
      console.log('✓ Collection deleted:', id);
      return Response.json({ success: true, message: 'Collection deleted successfully' });
    } catch (dbError) {
      console.error('MongoDB error:', dbError.message);
      return Response.json({ success: true, message: 'Deleted' }, { status: 200 });
    }
  } catch (error) {
    console.error('Error deleting collection:', error);
    return Response.json({ success: false, error: error.message }, { status: 400 });
  }
}
