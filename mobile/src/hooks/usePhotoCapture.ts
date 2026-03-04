import { useState, useCallback, useRef } from 'react';
import cameraService from '../services/camera.service';

const MAX_UPLOAD_RETRIES = 3;
const RETRY_DELAY_MS = 1500;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * usePhotoCapture Hook
 * Manages photo capture with GPS metadata and upload retry logic
 */
export const usePhotoCapture = () => {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const retryCountRef = useRef<Record<number, number>>({});

  /**
   * Capture a photo with GPS metadata
   */
  const capturePhoto = useCallback(async (photoAngle: string) => {
    setLoading(true);
    setError(null);

    try {
      const photo = await cameraService.capturePhoto();

      if (!photo) {
        setLoading(false);
        return null;
      }

      if (!cameraService.validateGpsAccuracy(photo.gpsAccuracy)) {
        setError(`GPS accuracy too low: ${photo.gpsAccuracy}m`);
        setLoading(false);
        return null;
      }

      const photoWithAngle = {
        ...photo,
        gpsAccuracy: typeof photo.gpsAccuracy === 'number' ? photo.gpsAccuracy : 0,
        photoAngle,
        uploadStatus: 'pending' as const,
      };

      setPhotos((prev) => [...prev, photoWithAngle]);
      setLoading(false);

      return photoWithAngle;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  /**
   * Upload a single photo with retry logic
   */
  const uploadPhotoWithRetry = useCallback(
    async (index: number, uploadFn: (photo: any) => Promise<any>): Promise<any> => {
      const photo = photos[index];
      if (!photo) throw new Error('Photo not found at index');

      let lastError: Error | null = null;
      const maxRetries = MAX_UPLOAD_RETRIES;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          // Update status to uploading
          setPhotos((prev) =>
            prev.map((p, i) => (i === index ? { ...p, uploadStatus: 'uploading' } : p))
          );

          const result = await uploadFn(photo);

          // Update status to uploaded
          setPhotos((prev) =>
            prev.map((p, i) => (i === index ? { ...p, uploadStatus: 'uploaded', ...result } : p))
          );

          retryCountRef.current[index] = 0;
          return result;
        } catch (err: any) {
          lastError = err;
          retryCountRef.current[index] = attempt + 1;

          if (attempt < maxRetries) {
            // Update status to retrying
            setPhotos((prev) =>
              prev.map((p, i) =>
                i === index ? { ...p, uploadStatus: 'retrying', retryAttempt: attempt + 1 } : p
              )
            );
            await delay(RETRY_DELAY_MS * (attempt + 1));
          }
        }
      }

      // All retries exhausted
      setPhotos((prev) =>
        prev.map((p, i) =>
          i === index ? { ...p, uploadStatus: 'failed', error: lastError?.message } : p
        )
      );
      throw lastError;
    },
    [photos]
  );

  /**
   * Upload all photos with retry and progress tracking
   */
  const uploadAllPhotos = useCallback(
    async (uploadFn: (photo: any) => Promise<any>) => {
      setUploadProgress(0);
      const total = photos.length;
      let completed = 0;
      const results: any[] = [];
      const errors: any[] = [];

      for (let i = 0; i < photos.length; i++) {
        try {
          const result = await uploadPhotoWithRetry(i, uploadFn);
          results.push(result);
        } catch (err) {
          errors.push({ index: i, error: err });
        }
        completed++;
        setUploadProgress(Math.round((completed / total) * 100));
      }

      return { results, errors, total, uploaded: results.length, failed: errors.length };
    },
    [photos, uploadPhotoWithRetry]
  );

  /**
   * Remove a photo from the list
   */
  const removePhoto = useCallback((index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /**
   * Clear all photos
   */
  const clearPhotos = useCallback(() => {
    setPhotos([]);
    setError(null);
    setUploadProgress(0);
    retryCountRef.current = {};
  }, []);

  /**
   * Check if minimum photos captured
   */
  const hasMinimumPhotos = useCallback(
    (minimum = 4) => {
      return photos.length >= minimum;
    },
    [photos]
  );

  return {
    photos,
    loading,
    error,
    uploadProgress,
    capturePhoto,
    uploadPhotoWithRetry,
    uploadAllPhotos,
    removePhoto,
    clearPhotos,
    hasMinimumPhotos,
  };
};
