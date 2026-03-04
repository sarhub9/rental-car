import express from 'express';
import AgreementController from '../controllers/agreement.controller.js';
import EvidenceController, { checkoutUpload, returnUpload } from '../controllers/evidence.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { enforceTenantIsolation } from '../middleware/tenant-isolation.middleware.js';
import { checkAgreementImmutability } from '../middleware/immutability-check.middleware.js';
import { validate, createAgreementSchema, updateAgreementSchema } from '../utils/validation.util.js';
import { uploadRateLimiter } from '../middleware/rate-limit.middleware.js';

const router = express.Router();

// Apply authentication and tenant isolation to all routes
router.use(authenticate);
router.use(enforceTenantIsolation);

/**
 * @route   POST /v1/agreements
 * @desc    Create new draft rental agreement
 * @access  Front Desk, Admin
 */
router.post(
  '/',
  requireRole('FRONT_DESK', 'OWNER_ADMIN'),
  validate(createAgreementSchema),
  AgreementController.create
);

/**
 * @route   PATCH /v1/agreements/:id
 * @desc    Update draft rental agreement
 * @access  Front Desk, Admin
 */
router.patch(
  '/:id',
  requireRole('FRONT_DESK', 'OWNER_ADMIN'),
  checkAgreementImmutability,
  validate(updateAgreementSchema),
  AgreementController.update
);

/**
 * @route   GET /v1/agreements/:id
 * @desc    Get agreement by ID
 * @access  Front Desk, Admin, Customer (own agreements only)
 */
router.get('/:id', AgreementController.getById);

/**
 * @route   GET /v1/agreements
 * @desc    List agreements with filters
 * @access  Front Desk, Admin, Customer (own agreements only)
 */
router.get('/', AgreementController.list);

/**
 * @route   POST /v1/agreements/:agreementId/checkout
 * @desc    Upload checkout evidence and activate agreement
 * @access  Front Desk, Admin
 */
router.post(
  '/:agreementId/checkout',
  requireRole('FRONT_DESK', 'OWNER_ADMIN'),
  uploadRateLimiter,
  checkoutUpload,
  EvidenceController.checkout
);

/**
 * @route   POST /v1/agreements/:agreementId/return
 * @desc    Upload return evidence and close agreement
 * @access  Front Desk, Admin
 */
router.post(
  '/:agreementId/return',
  requireRole('FRONT_DESK', 'OWNER_ADMIN'),
  uploadRateLimiter,
  returnUpload,
  EvidenceController.return
);

/**
 * @route   GET /v1/agreements/:agreementId/evidence
 * @desc    Get evidence for agreement
 * @access  Front Desk, Admin, Customer (own agreements only)
 */
router.get('/:agreementId/evidence', EvidenceController.getEvidence);

/**
 * @route   GET /v1/agreements/:agreementId/charges
 * @desc    Get charges for agreement
 * @access  Front Desk, Admin, Customer (own agreements only)
 */
router.get('/:agreementId/charges', async (req, res) => {
  try {
    const AgreementService = (await import('../services/agreement.service.js')).default;
    const charges = await AgreementService.getCharges(req.params.agreementId, req.tenantId);

    return res.status(200).json({
      success: true,
      data: charges,
    });
  } catch (error) {
    console.error('Get charges error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve charges',
    });
  }
});

export default router;
