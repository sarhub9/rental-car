import CheckoutEvidenceModel from '../models/checkout-evidence.model.js';
import ReturnEvidenceModel from '../models/return-evidence.model.js';
import PhotoEvidenceModel from '../models/photo-evidence.model.js';
import PhotoStorageService from './photo-storage.service.js';
import { validateGpsMetadata, validatePhotoTimestamp } from '../utils/photo-metadata.util.js';

/**
 * Evidence Service
 * Business logic for evidence capture and management
 */
class EvidenceService {
  /**
   * Create checkout evidence with photos
   */
  async createCheckoutEvidence(agreementId, tenantId, evidenceData, photos, userId) {
    // Validate minimum photo requirement
    if (!photos || photos.length < 4) {
      const error = new Error('Minimum 4 photos required for checkout');
      error.statusCode = 400;
      throw error;
    }

    // Validate GPS metadata for each photo
    for (const photo of photos) {
      // GPS is optional (web checkout/return has no GPS). Validate only when provided.
      if (photo.gps_latitude != null && photo.gps_longitude != null) {
        const gpsValidation = validateGpsMetadata(
          photo.gps_latitude,
          photo.gps_longitude,
          photo.gps_accuracy_meters
        );
        if (!gpsValidation.valid) {
          const error = new Error(`GPS validation failed: ${gpsValidation.errors.join(', ')}`);
          error.statusCode = 400;
          throw error;
        }
      }

      const timestampValidation = validatePhotoTimestamp(photo.captured_timestamp);
      if (!timestampValidation.valid) {
        const error = new Error(`Timestamp validation failed: ${timestampValidation.error}`);
        error.statusCode = 400;
        throw error;
      }
    }

    // Signature is captured on the agreement before activation (not during
    // checkout) — fall back to the agreement's signature so the evidence
    // satisfies the "signature or OTP" requirement.
    if (!evidenceData.customer_signature_url && !evidenceData.customer_otp_verified) {
      const RentalAgreementModel = (await import('../models/rental-agreement.model.js')).default;
      const agreement = await RentalAgreementModel.findById(agreementId, tenantId);
      if (agreement?.customer_signature_url) {
        evidenceData.customer_signature_url = agreement.customer_signature_url;
      }
    }

    // Make checkout idempotent: a previous partial attempt may have left an
    // orphan checkout_evidence row (unique per agreement). Clear it first.
    await PhotoEvidenceModel.deleteByAgreementAndType(agreementId, tenantId, 'CHECKOUT');
    await CheckoutEvidenceModel.deleteByAgreementId(agreementId, tenantId);

    // Create checkout evidence record
    const checkoutEvidence = await CheckoutEvidenceModel.create({
      tenant_id: tenantId,
      agreement_id: agreementId,
      odometer_reading: evidenceData.odometer_reading,
      fuel_level: evidenceData.fuel_level,
      accessories: evidenceData.accessories,
      customer_signature_url: evidenceData.customer_signature_url,
      customer_otp_verified: evidenceData.customer_otp_verified,
      otp_verification_timestamp: evidenceData.otp_verification_timestamp,
      captured_by_user_id: userId,
    });

    // Upload and save photos
    const savedPhotos = [];
    for (const photo of photos) {
      const photoRecord = await PhotoEvidenceModel.create({
        tenant_id: tenantId,
        agreement_id: agreementId,
        evidence_type: 'CHECKOUT',
        photo_angle: photo.photo_angle,
        photo_url: photo.photo_url,
        photo_thumbnail_url: photo.photo_thumbnail_url,
        file_size_bytes: photo.file_size_bytes,
        mime_type: photo.mime_type,
        captured_timestamp: photo.captured_timestamp,
        gps_latitude: photo.gps_latitude,
        gps_longitude: photo.gps_longitude,
        gps_accuracy_meters: photo.gps_accuracy_meters,
        device_info: photo.device_info,
      });
      savedPhotos.push(photoRecord);
    }

    return {
      checkoutEvidence,
      photos: savedPhotos,
    };
  }

  /**
   * Upload photo to storage
   */
  async uploadPhoto(fileBuffer, metadata) {
    return await PhotoStorageService.uploadPhoto(fileBuffer, metadata);
  }

  /**
   * Validate checkout evidence completeness
   */
  async validateCheckoutEvidence(agreementId, tenantId) {
    // Check if checkout evidence exists
    const evidence = await CheckoutEvidenceModel.findByAgreementId(agreementId, tenantId);
    if (!evidence) {
      return { valid: false, error: 'Checkout evidence not found' };
    }

    // Check minimum photo count
    const photoCount = await PhotoEvidenceModel.countByAgreementAndType(
      agreementId,
      tenantId,
      'CHECKOUT'
    );

    if (photoCount < 4) {
      return { valid: false, error: `Insufficient photos: ${photoCount}/4 required` };
    }

    // Check signature or OTP
    if (!evidence.customer_signature_url && !evidence.customer_otp_verified) {
      return { valid: false, error: 'Customer signature or OTP verification required' };
    }

    return { valid: true };
  }

  /**
   * Get checkout evidence with photos
   */
  async getCheckoutEvidence(agreementId, tenantId) {
    const evidence = await CheckoutEvidenceModel.findByAgreementId(agreementId, tenantId);
    if (!evidence) {
      return null;
    }

    const photos = await PhotoEvidenceModel.findByAgreementAndType(
      agreementId,
      tenantId,
      'CHECKOUT'
    );

    return {
      ...evidence,
      photos,
    };
  }

  /**
   * Create return evidence with photos
   */
  async createReturnEvidence(agreementId, tenantId, evidenceData, photos, userId) {
    // Validate minimum photo requirement
    if (!photos || photos.length < 4) {
      const error = new Error('Minimum 4 photos required for return');
      error.statusCode = 400;
      throw error;
    }

    // Validate GPS metadata for each photo
    for (const photo of photos) {
      // GPS is optional (web checkout/return has no GPS). Validate only when provided.
      if (photo.gps_latitude != null && photo.gps_longitude != null) {
        const gpsValidation = validateGpsMetadata(
          photo.gps_latitude,
          photo.gps_longitude,
          photo.gps_accuracy_meters
        );
        if (!gpsValidation.valid) {
          const error = new Error(`GPS validation failed: ${gpsValidation.errors.join(', ')}`);
          error.statusCode = 400;
          throw error;
        }
      }

      const timestampValidation = validatePhotoTimestamp(photo.captured_timestamp);
      if (!timestampValidation.valid) {
        const error = new Error(`Timestamp validation failed: ${timestampValidation.error}`);
        error.statusCode = 400;
        throw error;
      }
    }

    const returnPayload = {
      tenant_id: tenantId,
      agreement_id: agreementId,
      odometer_reading: evidenceData.odometer_reading,
      fuel_level: evidenceData.fuel_level,
      kilometers_driven: evidenceData.kilometers_driven,
      damage_documented: evidenceData.damage_documented,
      damage_description: evidenceData.damage_description,
      customer_acknowledgment: evidenceData.customer_acknowledgment,
      acknowledgment_timestamp: new Date(),
      captured_by_user_id: userId,
    };

    // Upsert safety: update existing evidence if this agreement is retried.
    let returnEvidence;
    const alreadyExists = await ReturnEvidenceModel.exists(agreementId, tenantId);
    if (alreadyExists) {
      returnEvidence = await ReturnEvidenceModel.updateByAgreementId(
        agreementId,
        tenantId,
        returnPayload
      );
    } else {
      try {
        returnEvidence = await ReturnEvidenceModel.create(returnPayload);
      } catch (error) {
        // Guard against races where another request inserted first.
        if (error?.code === '23505') {
          returnEvidence = await ReturnEvidenceModel.updateByAgreementId(
            agreementId,
            tenantId,
            returnPayload
          );
        } else {
          throw error;
        }
      }
    }

    // If return evidence already existed from a previous failed attempt,
    // replace old RETURN photos to keep data consistent and avoid duplicates.
    await PhotoEvidenceModel.deleteByAgreementAndType(agreementId, tenantId, 'RETURN');

    // Upload and save photos
    const savedPhotos = [];
    for (const photo of photos) {
      const photoRecord = await PhotoEvidenceModel.create({
        tenant_id: tenantId,
        agreement_id: agreementId,
        evidence_type: 'RETURN',
        photo_angle: photo.photo_angle,
        photo_url: photo.photo_url,
        photo_thumbnail_url: photo.photo_thumbnail_url,
        file_size_bytes: photo.file_size_bytes,
        mime_type: photo.mime_type,
        captured_timestamp: photo.captured_timestamp,
        gps_latitude: photo.gps_latitude,
        gps_longitude: photo.gps_longitude,
        gps_accuracy_meters: photo.gps_accuracy_meters,
        device_info: photo.device_info,
      });
      savedPhotos.push(photoRecord);
    }

    return {
      returnEvidence,
      photos: savedPhotos,
    };
  }

  /**
   * Validate return evidence completeness
   */
  async validateReturnEvidence(agreementId, tenantId) {
    // Check if return evidence exists
    const evidence = await ReturnEvidenceModel.findByAgreementId(agreementId, tenantId);
    if (!evidence) {
      return { valid: false, error: 'Return evidence not found' };
    }

    // Check minimum photo count
    const photoCount = await PhotoEvidenceModel.countByAgreementAndType(
      agreementId,
      tenantId,
      'RETURN'
    );

    if (photoCount < 4) {
      return { valid: false, error: `Insufficient photos: ${photoCount}/4 required` };
    }

    // Check customer acknowledgment
    if (!evidence.customer_acknowledgment) {
      return { valid: false, error: 'Customer acknowledgment required' };
    }

    return { valid: true };
  }

  /**
   * Get return evidence with photos
   */
  async getReturnEvidence(agreementId, tenantId) {
    const evidence = await ReturnEvidenceModel.findByAgreementId(agreementId, tenantId);
    if (!evidence) {
      return null;
    }

    const photos = await PhotoEvidenceModel.findByAgreementAndType(
      agreementId,
      tenantId,
      'RETURN'
    );

    return {
      ...evidence,
      photos,
    };
  }

  /**
   * Get all photos for agreement
   */
  async getAllPhotos(agreementId, tenantId) {
    return await PhotoEvidenceModel.findByAgreementId(agreementId, tenantId);
  }
}

export default new EvidenceService();
