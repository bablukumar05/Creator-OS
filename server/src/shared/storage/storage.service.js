import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'node:crypto';

const isR2 = Boolean(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID);
const isS3 = Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

function getS3Client() {
  if (isR2) {
    return new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return new S3Client({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'mock_access_key',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'mock_secret_key',
    },
  });
}

const s3Client = getS3Client();

export async function generatePresignedUploadUrl({
  fileName,
  mimeType,
  fileSize: _fileSize,
  organizationId,
  folder = 'uploads',
}) {
  const cleanName = String(fileName || 'file')
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .slice(0, 100);
  const randomSuffix = crypto.randomBytes(4).toString('hex');
  const orgPrefix = organizationId ? `org_${organizationId}` : 'general';
  const fileKey = `${folder}/${orgPrefix}/${Date.now()}_${randomSuffix}_${cleanName}`;
  const bucket = process.env.R2_BUCKET || process.env.AWS_S3_BUCKET || 'creatoros-storage';

  if (isR2 || (isS3 && process.env.AWS_S3_BUCKET)) {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: fileKey,
      ContentType: mimeType,
    });
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });
    const publicUrl = process.env.R2_PUBLIC_URL
      ? `${process.env.R2_PUBLIC_URL.replace(/\/$/, '')}/${fileKey}`
      : `https://${bucket}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${fileKey}`;

    return {
      provider: isR2 ? 'r2' : 's3',
      uploadUrl,
      fileKey,
      publicUrl,
      bucket,
      headers: { 'Content-Type': mimeType },
    };
  }

  const publicUrl = `/uploads/${fileKey}`;
  const uploadUrl = `/api/v1/assets/mock-direct-upload?key=${encodeURIComponent(fileKey)}`;
  return {
    provider: 'local',
    uploadUrl,
    fileKey,
    publicUrl,
    bucket: 'local-dev',
    headers: { 'Content-Type': mimeType },
  };
}

export async function generatePresignedDownloadUrl({ fileKey, expiresIn = 3600 }) {
  const bucket = process.env.R2_BUCKET || process.env.AWS_S3_BUCKET || 'creatoros-storage';
  if (isR2 || (isS3 && process.env.AWS_S3_BUCKET)) {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: fileKey,
    });
    return await getSignedUrl(s3Client, command, { expiresIn });
  }
  return `/uploads/${fileKey}`;
}
