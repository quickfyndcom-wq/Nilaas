import { NextResponse } from 'next/server';
import { uploadFileToS3 } from '@/configs/s3';

export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('image') || formData.get('file');
    if (!file || typeof file.arrayBuffer !== 'function') {
      return NextResponse.json({ error: 'No image uploaded' }, { status: 400 });
    }

    const uploadResponse = await uploadFileToS3(file, 'profile-images');
    return NextResponse.json({ url: uploadResponse.url });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
