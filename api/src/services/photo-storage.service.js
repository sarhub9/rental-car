import s3Client, { BUCKET_NAME } from '../config/s3.js';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

/**
 * Photo Storage Service
 * Handles photo upload, compression, thumbnail generation, and S3 storage
 */
class PhotoStorageService {
  constructor() {
    this.s3DisabledForSession = false;
  }

  isStrictS3Mode() {
    return (process.env.PHOTO_STORAGE_STRICT || 'false').toLowerCase() === 'true';
  }

  isLocalS3Endpoint() {
    const endpoint = (process.env.S3_ENDPOINT || '').toLowerCase();
    return endpoint.includes('localhost') || endpoint.includes('127.0.0.1');
  }

  isS3Configured() {
    return Boolean(
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.AWS_ACCESS_KEY_ID !== 'your_access_key'
    );
  }

  getStorageMode() {
    if (this.s3DisabledForSession) return 'local';
    const mode = (process.env.PHOTO_STORAGE_MODE || 'auto').toLowerCase();
    if (mode === 'local') return 'local';
    if (mode === 's3') return 's3';
    if (this.isLocalS3Endpoint() && !this.isStrictS3Mode()) return 'local';
    return this.isS3Configured() ? 's3' : 'local';
  }

  getLocalUploadsRoot() {
    return path.resolve(process.cwd(), 'uploads');
  }

  getPublicBaseUrl() {
    if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL.replace(/\/$/, '');
    const port = process.env.PORT || 3000;
    return `http://localhost:${port}`;
  }

  async uploadPhotoLocal(compressedPhoto, thumbnail, metadata, photoId) {
    const { tenantId, agreementId, evidenceType } = metadata;
    const dirPath = path.join(this.getLocalUploadsRoot(), tenantId, agreementId, evidenceType);
    await fs.mkdir(dirPath, { recursive: true });

    const photoFileName = `${photoId}.jpg`;
    const thumbFileName = `${photoId}_thumb.jpg`;
    const photoAbsPath = path.join(dirPath, photoFileName);
    const thumbAbsPath = path.join(dirPath, thumbFileName);

    await fs.writeFile(photoAbsPath, compressedPhoto);
    await fs.writeFile(thumbAbsPath, thumbnail);

    const baseUrl = this.getPublicBaseUrl();
    const relativeDir = `${tenantId}/${agreementId}/${evidenceType}`;
    return {
      photoUrl: `${baseUrl}/uploads/${relativeDir}/${photoFileName}`,
      thumbnailUrl: `${baseUrl}/uploads/${relativeDir}/${thumbFileName}`,
      fileSize: compressedPhoto.length,
    };
  }

  /**
   * Upload photo to S3 with compression and thumbnail generation
   */
  async uploadPhoto(fileBuffer, metadata) {
    try {
      const photoId = uuidv4();
      const { tenantId, agreementId, evidenceType, photoAngle } = metadata;

      // Compress original photo
      const compressedPhoto = await sharp(fileBuffer)
        .jpeg({ quality: 85, progressive: true })
        .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
        .toBuffer();

      // Generate thumbnail
      const thumbnail = await sharp(fileBuffer)
        .jpeg({ quality: 70 })
        .resize(320, 240, { fit: 'cover' })
        .toBuffer();

      const storageMode = this.getStorageMode();
      if (storageMode === 'local') {
        return await this.uploadPhotoLocal(compressedPhoto, thumbnail, metadata, photoId);
      }

      // Upload original compressed photo
      const photoKey = `${tenantId}/${agreementId}/${evidenceType}/${photoId}.jpg`;
      await s3Client
        .putObject({
          Bucket: BUCKET_NAME,
          Key: photoKey,
          Body: compressedPhoto,
          ContentType: 'image/jpeg',
          Metadata: {
            tenantId,
            agreementId,
            evidenceType,
            photoAngle,
          },
        })
        .promise();

      // Upload thumbnail
      const thumbnailKey = `${tenantId}/${agreementId}/${evidenceType}/${photoId}_thumb.jpg`;
      await s3Client
        .putObject({
          Bucket: BUCKET_NAME,
          Key: thumbnailKey,
          Body: thumbnail,
          ContentType: 'image/jpeg',
        })
        .promise();

      return {
        photoUrl: this.getPhotoUrl(photoKey),
        thumbnailUrl: this.getPhotoUrl(thumbnailKey),
        fileSize: compressedPhoto.length,
      };
    } catch (error) {
      console.error('Photo upload error:', error);
      const strictS3 = this.isStrictS3Mode();
      const networkingError =
        error?.code === 'NetworkingError' ||
        error?.code === 'ECONNREFUSED' ||
        String(error?.message || '').includes('ECONNREFUSED');
      if (networkingError && !strictS3) {
        this.s3DisabledForSession = true;
        console.warn('S3 endpoint unreachable, switching to local photo storage for this session.');
      }
      if (!strictS3) {
        try {
          const photoId = uuidv4();
          const compressedPhoto = await sharp(fileBuffer)
            .jpeg({ quality: 85, progressive: true })
            .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
            .toBuffer();
          const thumbnail = await sharp(fileBuffer)
            .jpeg({ quality: 70 })
            .resize(320, 240, { fit: 'cover' })
            .toBuffer();
          return await this.uploadPhotoLocal(compressedPhoto, thumbnail, metadata, photoId);
        } catch (fallbackError) {
          console.error('Local photo fallback failed:', fallbackError);
        }
      }
      throw new Error('Failed to upload photo to storage');
    }
  }

  /**
   * Generate signed URL for secure photo access
   */
  async getSignedUrl(photoKey, expiresIn = 3600) {
    try {
      const url = await s3Client.getSignedUrlPromise('getObject', {
        Bucket: BUCKET_NAME,
        Key: photoKey,
        Expires: expiresIn,
      });
      return url;
    } catch (error) {
      console.error('Signed URL generation error:', error);
      throw new Error('Failed to generate signed URL');
    }
  }

  /**
   * Get photo URL (public or signed based on configuration)
   */
  getPhotoUrl(photoKey) {
    if (process.env.S3_ENDPOINT) {
      // For MinIO local development
      return `${process.env.S3_ENDPOINT}/${BUCKET_NAME}/${photoKey}`;
    }
    // For AWS S3
    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${photoKey}`;
  }

  /**
   * Delete photo from S3
   */
  async deletePhoto(photoKey) {
    try {
      await s3Client
        .deleteObject({
          Bucket: BUCKET_NAME,
          Key: photoKey,
        })
        .promise();
    } catch (error) {
      console.error('Photo deletion error:', error);
      throw new Error('Failed to delete photo from storage');
    }
  }
}

export default new PhotoStorageService();
