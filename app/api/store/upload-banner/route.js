import { uploadFileToS3 } from '@/configs/s3';

export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return Response.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    try {
      const result = await uploadFileToS3(file, 'banner-uploads');
      console.log('Image uploaded successfully:', result.url);
      return Response.json({
        success: true,
        url: result.url,
        fileId: result.fileId
      });
    } catch (s3Error) {
      console.error('S3 upload error:', s3Error.message);
      return Response.json({
        success: false,
        error: 'S3 upload failed: ' + s3Error.message
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Image upload error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
