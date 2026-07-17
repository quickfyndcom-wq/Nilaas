import { uploadFileToS3 } from "@/configs/s3";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    console.log('📥 [Collections Upload] Endpoint called');

    const formData = await request.formData();
    const image = formData.get('image');

    if (!image) {
      console.error('❌ No image in FormData');
      return Response.json({ error: "No image provided" }, { status: 400 });
    }

    console.log('✅ Image received:', image.name, image.size, 'bytes');

    try {
      console.log('⬆️ Uploading to S3...');
      const response = await uploadFileToS3(image, "collections");
      console.log('✅ Upload successful:', response.url);
      return Response.json({
        success: true,
        url: response.url
      });
    } catch (s3Error) {
      console.error('❌ S3 error:', s3Error.message);
      throw s3Error;
    }
  } catch (error) {
    console.error('❌ Upload error:', error.message);
    return Response.json(
      { error: error.message || "Failed to upload image" },
      { status: 500 }
    );
  }
}
