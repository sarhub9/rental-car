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

/**
 * @route   GET /v1/agreements/:id/payments
 * @desc    List payments recorded against an agreement
 */
router.get('/:id/payments', async (req, res) => {
  try {
    const PaymentModel = (await import('../models/payment.model.js')).default;
    const payments = await PaymentModel.listByAgreement(req.params.id, req.tenantId);
    return res.status(200).json({ success: true, data: payments });
  } catch (error) {
    console.error('List agreement payments error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * @route   POST /v1/agreements/:id/payments
 * @desc    Record a payment against an agreement
 * @access  Front Desk, Admin, Accounts
 */
router.post('/:id/payments', requireRole('FRONT_DESK', 'OWNER_ADMIN', 'ACCOUNTS'), async (req, res) => {
  try {
    const PaymentModel = (await import('../models/payment.model.js')).default;
    const RentalAgreementModel = (await import('../models/rental-agreement.model.js')).default;

    const agreement = await RentalAgreementModel.findById(req.params.id, req.tenantId);
    if (!agreement) return res.status(404).json({ error: 'Agreement not found' });

    const amount = Number(req.body.amount);
    if (!amount || amount <= 0) return res.status(400).json({ error: 'A positive amount is required' });

    const validMethods = ['CASH', 'CARD', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE'];
    const method = String(req.body.payment_method || 'CASH').toUpperCase();
    if (!validMethods.includes(method)) {
      return res.status(400).json({ error: `payment_method must be one of ${validMethods.join(', ')}` });
    }

    const payment_number = await PaymentModel.generatePaymentNumber(req.tenantId);
    const payment = await PaymentModel.create({
      tenant_id: req.tenantId,
      payment_number,
      agreement_id: agreement.id,
      customer_id: agreement.customer_id,
      amount,
      payment_method: method,
      payment_status: 'COMPLETED',
      transaction_reference: req.body.transaction_reference,
      notes: req.body.notes,
      received_by_user_id: req.user.id,
    });

    return res.status(201).json({ success: true, data: payment });
  } catch (error) {
    console.error('Record agreement payment error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * @route   PATCH /v1/agreements/:id/signature
 * @desc    Save the customer signature URL on an agreement
 * @access  Front Desk, Admin
 */
router.patch('/:id/signature', requireRole('FRONT_DESK', 'OWNER_ADMIN'), async (req, res) => {
  try {
    const RentalAgreementModel = (await import('../models/rental-agreement.model.js')).default;
    if (!req.body.customer_signature_url) {
      return res.status(400).json({ error: 'customer_signature_url is required' });
    }
    const updated = await RentalAgreementModel.setSignature(
      req.params.id,
      req.tenantId,
      req.body.customer_signature_url
    );
    if (!updated) return res.status(404).json({ error: 'Agreement not found' });
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Save agreement signature error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * @route   PATCH /v1/agreements/:id/officer-signature
 * @desc    Save the officer / company-representative signature URL
 * @access  Front Desk, Admin
 */
router.patch('/:id/officer-signature', requireRole('FRONT_DESK', 'OWNER_ADMIN'), async (req, res) => {
  try {
    const RentalAgreementModel = (await import('../models/rental-agreement.model.js')).default;
    if (!req.body.officer_signature_url) {
      return res.status(400).json({ error: 'officer_signature_url is required' });
    }
    const updated = await RentalAgreementModel.setOfficerSignature(
      req.params.id, req.tenantId, req.body.officer_signature_url
    );
    if (!updated) return res.status(404).json({ error: 'Agreement not found' });
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Save officer signature error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * @route   PATCH /v1/agreements/:id/inspection
 * @desc    Save the vehicle inspection (before/after checklist + photos + notes)
 * @access  Front Desk, Admin
 */
router.patch('/:id/inspection', requireRole('FRONT_DESK', 'OWNER_ADMIN'), async (req, res) => {
  try {
    const RentalAgreementModel = (await import('../models/rental-agreement.model.js')).default;
    if (!req.body.inspection || typeof req.body.inspection !== 'object') {
      return res.status(400).json({ error: 'inspection object is required' });
    }
    const updated = await RentalAgreementModel.saveInspection(
      req.params.id, req.tenantId, req.body.inspection
    );
    if (!updated) return res.status(404).json({ error: 'Agreement not found' });
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Save inspection error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
