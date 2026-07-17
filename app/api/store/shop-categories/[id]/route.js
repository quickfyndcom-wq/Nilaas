import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function DELETE(req, { params }) {
  try {
    const categoryId = params.id;

    try {
      const { db } = await connectToDatabase();
      await db.collection('shopCategories').deleteOne({
        _id: new ObjectId(categoryId)
      });
      
      console.log('✓ Category deleted:', categoryId);
      return Response.json({ 
        success: true, 
        message: 'Category deleted successfully' 
      });
    } catch (dbError) {
      console.error('✗ MongoDB error:', dbError.message);
      return Response.json({ 
        success: false, 
        error: 'Failed to delete from database' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('✗ Error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
