import sharp from 'sharp';

/**
 * Photo Metadata Utility
 * Extracts and validates GPS and timestamp metadata from photos
 */

/**
 * Extract EXIF metadata from photo buffer
 */
export const extractPhotoMetadata = async (fileBuffer) => {
  try {
    const metadata = await sharp(fileBuffer).metadata();

    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: metadata.size,
      exif: metadata.exif || {},
    };
  } catch (error) {
    console.error('Metadata extraction error:', error);
    return null;
  }
};

/**
 * Validate GPS metadata
 */
export const validateGpsMetadata = (latitude, longitude, accuracy) => {
  const errors = [];

  if (latitude === null || latitude === undefined) {
    errors.push('GPS latitude is required');
  } else if (latitude < -90 || latitude > 90) {
    errors.push('GPS latitude must be between -90 and 90');
  }

  if (longitude === null || longitude === undefined) {
    errors.push('GPS longitude is required');
  } else if (longitude < -180 || longitude > 180) {
    errors.push('GPS longitude must be between -180 and 180');
  }

  if (process.env.REQUIRE_GPS_METADATA === 'true') {
    const threshold = parseFloat(process.env.GPS_ACCURACY_THRESHOLD_METERS || '100');
    if (accuracy && accuracy > threshold) {
      errors.push(`GPS accuracy (${accuracy}m) exceeds threshold (${threshold}m)`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Validate photo timestamp
 */
export const validatePhotoTimestamp = (capturedTimestamp) => {
  const now = new Date();
  const captured = new Date(capturedTimestamp);

  // Check if timestamp is in the future
  if (captured > now) {
    return {
      valid: false,
      error: 'Photo timestamp cannot be in the future',
    };
  }

  // Check if timestamp is too old (more than 24 hours)
  const hoursDiff = (now - captured) / (1000 * 60 * 60);
  if (hoursDiff > 24) {
    return {
      valid: false,
      error: 'Photo timestamp is too old (more than 24 hours)',
    };
  }

  return { valid: true };
};

/**
 * Parse device info from request
 */
export const parseDeviceInfo = (userAgent) => {
  return {
    userAgent,
    timestamp: new Date().toISOString(),
  };
};
