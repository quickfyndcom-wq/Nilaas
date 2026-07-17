import { uploadFileToS3 } from "@/configs/s3";
import { getAuth } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const formData = await req.formData();
    const file = formData.get("file");
    const folder = formData.get("folder") || "uploads";

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const uploadResponse = await uploadFileToS3(
      file,
      `${String(folder).replace(/^\/+|\/+$/g, "")}/${userId}`
    );

    return NextResponse.json(
      {
        url: uploadResponse.url,
        fileId: uploadResponse.fileId,
        name: uploadResponse.name,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("S3 upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload image" },
      { status: 500 }
    );
  }
}
