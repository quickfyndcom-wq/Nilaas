import { connectToDatabase } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { getAuth } from 'firebase-admin/auth';

// Verify admin user authentication
async function verifyAdmin(req) {
  try {
    const token = req.headers.get('authorization')?.split('Bearer ')[1];
    if (!token) return null;

    const decodedToken = await getAuth().verifyIdToken(token);
    const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').split(',').map(e => e.trim());
    
    if (!adminEmails.includes(decodedToken.email)) {
      return null;
    }

    return { userId: decodedToken.uid, email: decodedToken.email };
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

// POST - Set store credentials
export async function POST(req) {
  try {
    const auth = await verifyAdmin(req);
    if (!auth) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { storeId, username, email, password } = await req.json();

    if (!storeId || !username || !password) {
      return Response.json({ 
        success: false, 
        error: 'Store ID, username, and password are required' 
      }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Check if store exists
    const store = await db.collection('stores').findOne({ _id: new ObjectId(storeId) });

    if (!store) {
      return Response.json({ 
        success: false, 
        error: 'Store not found' 
      }, { status: 404 });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update store with credentials
    await db.collection('stores').updateOne(
      { _id: new ObjectId(storeId) },
      { 
        $set: { 
          credentials: {
            username: username,
            email: email || store.email,
            password: hashedPassword,
            updatedAt: new Date(),
            updatedBy: auth.email
          },
          updatedAt: new Date()
        } 
      }
    );

    return Response.json({ 
      success: true, 
      message: 'Store credentials set successfully' 
    });

  } catch (error) {
    console.error('Error setting store credentials:', error);
    return Response.json({ 
      success: false, 
      error: 'Failed to set credentials' 
    }, { status: 500 });
  }
}

// PUT - Update store credentials
export async function PUT(req) {
  try {
    const { storeId, currentPassword, newPassword, username, email } = await req.json();

    if (!storeId || !currentPassword || !newPassword) {
      return Response.json({ 
        success: false, 
        error: 'Current password and new password are required' 
      }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    const store = await db.collection('stores').findOne({ _id: new ObjectId(storeId) });

    if (!store || !store.credentials) {
      return Response.json({ 
        success: false, 
        error: 'Store not found or credentials not set' 
      }, { status: 404 });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, store.credentials.password);

    if (!isValidPassword) {
      return Response.json({ 
        success: false, 
        error: 'Current password is incorrect' 
      }, { status: 401 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update credentials
    await db.collection('stores').updateOne(
      { _id: new ObjectId(storeId) },
      { 
        $set: { 
          'credentials.password': hashedPassword,
          'credentials.username': username || store.credentials.username,
          'credentials.email': email || store.credentials.email,
          'credentials.updatedAt': new Date(),
          updatedAt: new Date()
        } 
      }
    );

    return Response.json({ 
      success: true, 
      message: 'Credentials updated successfully' 
    });

  } catch (error) {
    console.error('Error updating credentials:', error);
    return Response.json({ 
      success: false, 
      error: 'Failed to update credentials' 
    }, { status: 500 });
  }
}
