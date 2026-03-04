import AWS from 'aws-sdk';
import dotenv from 'dotenv';

dotenv.config();

// Configure AWS S3 client
const s3Client = new AWS.S3({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  endpoint: process.env.S3_ENDPOINT || undefined,
  s3ForcePathStyle: !!process.env.S3_ENDPOINT, // Required for MinIO
  signatureVersion: 'v4',
  httpOptions: {
    connectTimeout: parseInt(process.env.S3_CONNECT_TIMEOUT_MS || '4000', 10),
    timeout: parseInt(process.env.S3_TIMEOUT_MS || '8000', 10),
  },
  maxRetries: parseInt(process.env.S3_MAX_RETRIES || '1', 10),
});

// Bucket name from environment
export const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'erp-photos-dev';

// Test S3 connection (non-blocking)
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_ACCESS_KEY_ID !== 'your_access_key') {
  try {
    s3Client.headBucket({ Bucket: BUCKET_NAME }, (err) => {
      if (err) {
        console.warn('S3 bucket not accessible:', err.message);
        console.warn('Photo upload will fail until S3 is configured (non-blocking)');
      } else {
        console.log('S3 bucket accessible:', BUCKET_NAME);
      }
    });
  } catch {
    console.warn('S3 check failed (non-blocking) — photo uploads disabled');
  }
} else {
  console.warn('S3 not configured - photo uploads disabled. Set AWS credentials in .env');
}

export default s3Client;
