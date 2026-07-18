import { NextResponse } from 'next/server';
import { uploadFileToS3 } from '@/configs/s3';
import { auth as adminAuth } from '@/lib/firebase-admin';
import authSeller from '@/middlewares/authSeller';

export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const storeId = await authSeller(decodedToken.uid);
    if (!storeId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!file.type?.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'Only image uploads are allowed' },
        { status: 400 }
      );
    }

    const response = await uploadFileToS3(
      file,
      `blog-uploads/${decodedToken.uid}`
    );

    return NextResponse.json({
      success: true,
      url: response.url,
      fileId: response.fileId,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to upload image' },
      { status: 500 }
    );
  }
}
