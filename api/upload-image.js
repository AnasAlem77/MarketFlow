import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

const allowedTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
  }
});

export default async function handler(req, res) {
  // Temporary R2 environment check.
  // This does NOT print any secret values.
  console.log('R2 ENV CHECK:', {
    accountId: Boolean(process.env.R2_ACCOUNT_ID),
    accessKeyId: Boolean(process.env.R2_ACCESS_KEY_ID),
    secretAccessKey: Boolean(process.env.R2_SECRET_ACCESS_KEY),
    bucketName: process.env.R2_BUCKET_NAME || null,
    publicUrl: process.env.R2_PUBLIC_URL || null
  });

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    const {
      fileName,
      contentType,
      fileSize
    } = req.body || {};

    if (!fileName || !contentType) {
      return res.status(400).json({
        success: false,
        message: 'fileName and contentType are required'
      });
    }

    if (!allowedTypes.includes(contentType)) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported image type'
      });
    }

    if (fileSize && Number(fileSize) > MAX_FILE_SIZE) {
      return res.status(400).json({
        success: false,
        message: 'Image size must be 10MB or less'
      });
    }

    const extension = fileName.includes('.')
      ? fileName.substring(fileName.lastIndexOf('.')).toLowerCase()
      : '';

    const safeExtension = allowedTypes.includes(contentType)
      ? extension || getExtensionFromMime(contentType)
      : '';

    const uniqueName = `${crypto.randomUUID()}${safeExtension}`;

    const key = `products/${uniqueName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType
    });

    const uploadUrl = await getSignedUrl(r2, command, {
      expiresIn: 300
    });

    const publicUrl =
      `/api/image?key=${encodeURIComponent(key)}`;

    return res.status(200).json({
      success: true,
      uploadUrl,
      publicUrl,
      key
    });

  } catch (error) {
    console.error('R2 upload URL error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to create upload URL'
    });
  }
}

function getExtensionFromMime(contentType) {
  const extensions = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif'
  };

  return extensions[contentType] || '';
}