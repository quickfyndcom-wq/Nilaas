import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import path from "path";
import { randomUUID } from "crypto";

let _client = null;

function getConfig() {
  const region = process.env.AWS_REGION;
  const bucket = process.env.AWS_S3_BUCKET;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!region || !bucket || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "S3 is not configured - set AWS_REGION, AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY"
    );
  }

  return { region, bucket, accessKeyId, secretAccessKey };
}

export function getS3Client() {
  if (_client) return _client;
  const { region, accessKeyId, secretAccessKey } = getConfig();
  _client = new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });
  return _client;
}

export function getPublicUrl(key) {
  const { region, bucket } = getConfig();
  const base =
    process.env.AWS_S3_PUBLIC_URL ||
    process.env.NEXT_PUBLIC_S3_BASE_URL ||
    `https://${bucket}.s3.${region}.amazonaws.com`;
  return `${base.replace(/\/$/, "")}/${key.replace(/^\//, "")}`;
}

function sanitizeFileName(fileName = "file") {
  const ext = path.extname(fileName) || "";
  const base = path
    .basename(fileName, ext)
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .slice(0, 80);
  return `${base || "file"}${ext.toLowerCase()}`;
}

/**
 * Upload a buffer/file to S3 and return the public URL.
 * @param {{ buffer: Buffer, fileName: string, folder?: string, contentType?: string }} opts
 */
export async function uploadToS3({
  buffer,
  fileName,
  folder = "uploads",
  contentType = "application/octet-stream",
}) {
  const { bucket } = getConfig();
  const client = getS3Client();
  const cleanFolder = String(folder || "uploads").replace(/^\/+|\/+$/g, "");
  const key = `${cleanFolder}/${Date.now()}-${randomUUID().slice(0, 8)}-${sanitizeFileName(fileName)}`;

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  const url = getPublicUrl(key);
  return { url, key, fileId: key, name: path.basename(key) };
}

/**
 * Upload a File/Blob from a FormData request.
 */
export async function uploadFileToS3(file, folder = "uploads") {
  if (!file || typeof file.arrayBuffer !== "function") {
    throw new Error("No file provided");
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  return uploadToS3({
    buffer,
    fileName: file.name || "upload",
    folder,
    contentType: file.type || "application/octet-stream",
  });
}
