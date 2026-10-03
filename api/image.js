import {
  S3Client,
  GetObjectCommand
} from '@aws-sdk/client-s3';

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
  }
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    const key = req.query?.key;

    if (!key || typeof key !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Missing image key'
      });
    }

    if (!key.startsWith('products/')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image key'
      });
    }

    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key
    });

    const object = await r2.send(command);

    if (!object.Body) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    res.setHeader(
      'Content-Type',
      object.ContentType || 'application/octet-stream'
    );

    res.setHeader(
      'Cache-Control',
      'public, max-age=31536000, immutable'
    );

    if (object.ContentLength) {
      res.setHeader('Content-Length', object.ContentLength);
    }

    const chunks = [];

    for await (const chunk of object.Body) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);

    return res.status(200).send(buffer);

  } catch (error) {
    console.error('R2 image proxy error:', error);

    return res.status(404).json({
      success: false,
      message: 'Image not found'
    });
  }
}