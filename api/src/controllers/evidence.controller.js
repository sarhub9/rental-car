import EvidenceService from '../services/evidence.service.js';
import AgreementService from '../services/agreement.service.js';
import multer from 'multer';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_PHOTO_SIZE_MB || '10') * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = (process.env.ALLOWED_PHOTO_TYPES || 'image/jpeg,image/png').split(',');
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`));
    }
  },
});

/**
 * Evidence Controller
 * Handles HTTP requests for evidence capture
 */
class EvidenceController {
  /**
   * Upload checkout evidence
   * POST /agreements/:agreementId/checkout
   */
  async checkout(req, res) {
    try {
      const { agreementId } = req.params;

      // Parse evidence data from request body
      const evidenceData = {
        odometer_reading: parseInt(req.body.odometer_reading),
        fuel_level: req.body.fuel_level,
        accessories: req.body.accessories ? JSON.parse(req.body.accessories) : null,
        customer_signature_url: req.body.customer_signature_url,
        customer_otp_verified: req.body.customer_otp_verified === 'true',
        otp_verification_timestamp: req.body.otp_verification_timestamp,
      };

      // Process uploaded photos
      const photos = [];
      if (req.files && req.files.length > 0) {
        for (const [index, file] of req.files.entries()) {
          const anglesList = Array.isArray(req.body.photo_angles)
            ? req.body.photo_angles
            : (req.body.photo_angles ? [req.body.photo_angles] : []);
          const angle = anglesList[index] || req.body[`photo_${index}_angle`] || 'FRONT';
          // Upload photo to storage
          const uploadResult = await EvidenceService.uploadPhoto(file.buffer, {
            tenantId: req.tenantId,
            agreementId,
            evidenceType: 'CHECKOUT',
            photoAngle: angle,
          });

          photos.push({
            photo_angle: angle,
            photo_url: uploadResult.photoUrl,
            photo_thumbnail_url: uploadResult.thumbnailUrl,
            file_size_bytes: uploadResult.fileSize,
            mime_type: file.mimetype,
            captured_timestamp: req.body[`photo_${index}_timestamp`] || new Date().toISOString(),
            gps_latitude: Number.isFinite(parseFloat(req.body[`photo_${index}_latitude`])) ? parseFloat(req.body[`photo_${index}_latitude`]) : null,
            gps_longitude: Number.isFinite(parseFloat(req.body[`photo_${index}_longitude`])) ? parseFloat(req.body[`photo_${index}_longitude`]) : null,
            gps_accuracy_meters: Number.isFinite(parseFloat(req.body[`photo_${index}_accuracy`])) ? parseFloat(req.body[`photo_${index}_accuracy`]) : null,
            device_info: req.body.device_info ? JSON.parse(req.body.device_info) : null,
          });
        }
      }

      // Create checkout evidence
      const result = await EvidenceService.createCheckoutEvidence(
        agreementId,
        req.tenantId,
        evidenceData,
        photos,
        req.user.id
      );

      // Activate agreement
      await AgreementService.activateAgreement(
        agreementId,
        req.tenantId,
        req.user.id,
        req.ip,
        req.get('user-agent')
      );

      return res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Checkout evidence error:', error);

      if (error.statusCode) {
        return res.status(error.statusCode).json({
          error: error.message,
        });
      }

      return res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to process checkout evidence',
      });
    }
  }

  /**
   * Upload return evidence
   * POST /agreements/:agreementId/return
   */
  async return(req, res) {
    try {
      const { agreementId } = req.params;

      // Get checkout evidence for validation
      const checkoutEvidence = await EvidenceService.getCheckoutEvidence(agreementId, req.tenantId);
      if (!checkoutEvidence) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Checkout evidence not found. Cannot process return.',
        });
      }

      // Parse evidence data from request body
      const returnOdometer = parseInt(req.body.odometer_reading);

      // Validate return odometer >= checkout odometer
      if (returnOdometer < checkoutEvidence.odometer_reading) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Return odometer cannot be less than checkout odometer',
        });
      }

      const kmDriven = returnOdometer - checkoutEvidence.odometer_reading;

      const evidenceData = {
        odometer_reading: returnOdometer,
        fuel_level: req.body.fuel_level,
        kilometers_driven: kmDriven,
        damage_documented: req.body.damage_documented === 'true',
        damage_description: req.body.damage_description,
        customer_acknowledgment: req.body.customer_acknowledgment === 'true',
      };

      // Process uploaded photos
      const photos = [];
      if (req.files && req.files.length > 0) {
        for (const [index, file] of req.files.entries()) {
          const anglesList = Array.isArray(req.body.photo_angles)
            ? req.body.photo_angles
            : (req.body.photo_angles ? [req.body.photo_angles] : []);
          const angle = anglesList[index] || req.body[`photo_${index}_angle`] || 'FRONT';
          const uploadResult = await EvidenceService.uploadPhoto(file.buffer, {
            tenantId: req.tenantId,
            agreementId,
            evidenceType: 'RETURN',
            photoAngle: angle,
          });

          photos.push({
            photo_angle: angle,
            photo_url: uploadResult.photoUrl,
            photo_thumbnail_url: uploadResult.thumbnailUrl,
            file_size_bytes: uploadResult.fileSize,
            mime_type: file.mimetype,
            captured_timestamp: req.body[`photo_${index}_timestamp`] || new Date().toISOString(),
            gps_latitude: Number.isFinite(parseFloat(req.body[`photo_${index}_latitude`])) ? parseFloat(req.body[`photo_${index}_latitude`]) : null,
            gps_longitude: Number.isFinite(parseFloat(req.body[`photo_${index}_longitude`])) ? parseFloat(req.body[`photo_${index}_longitude`]) : null,
            gps_accuracy_meters: Number.isFinite(parseFloat(req.body[`photo_${index}_accuracy`])) ? parseFloat(req.body[`photo_${index}_accuracy`]) : null,
            device_info: req.body.device_info ? JSON.parse(req.body.device_info) : null,
          });
        }
      }

      // Create return evidence
      const returnEvidence = await EvidenceService.createReturnEvidence(
        agreementId,
        req.tenantId,
        evidenceData,
        photos,
        req.user.id
      );

      // Generate charges
      const charges = await AgreementService.generateCharges(
        agreementId,
        req.tenantId,
        checkoutEvidence,
        returnEvidence.returnEvidence
      );

      // Close agreement
      await AgreementService.closeAgreement(
        agreementId,
        req.tenantId,
        req.user.id,
        req.ip,
        req.get('user-agent'),
        charges
      );

      const totalCharges = charges.reduce((sum, charge) => sum + charge.amount, 0);

      return res.status(201).json({
        success: true,
        data: {
          return_evidence: returnEvidence,
          charges,
          total_charges: totalCharges,
        },
      });
    } catch (error) {
      console.error('Return evidence error:', error);

      if (error.statusCode) {
        return res.status(error.statusCode).json({
          error: error.message,
        });
      }

      return res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to process return evidence',
      });
    }
  }

  /**
   * Get evidence for agreement
   * GET /agreements/:agreementId/evidence
   */
  async getEvidence(req, res) {
    try {
      const { agreementId } = req.params;

      const checkoutEvidence = await EvidenceService.getCheckoutEvidence(agreementId, req.tenantId);
      const returnEvidence = await EvidenceService.getReturnEvidence(agreementId, req.tenantId);

      return res.status(200).json({
        success: true,
        data: {
          checkout: checkoutEvidence,
          return: returnEvidence,
        },
      });
    } catch (error) {
      console.error('Get evidence error:', error);

      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve evidence',
      });
    }
  }
}

// Export controller instance and multer middleware
const controller = new EvidenceController();
export const checkoutUpload = upload.array('photos', 10);
export const returnUpload = upload.array('photos', 10);
export default controller;
