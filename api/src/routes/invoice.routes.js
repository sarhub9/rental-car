import express from 'express';
import InvoiceController from '../controllers/invoice.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { enforceTenantIsolation } from '../middleware/tenant-isolation.middleware.js';

const router = express.Router();

// All routes require authentication and tenant isolation
router.use(authenticate);
router.use(enforceTenantIsolation);

// ---- Admin/Front Desk Routes ----

/**
 * @route   POST /v1/invoices/generate/:agreementId
 * @desc    Generate invoice for a closed agreement
 * @access  Front Desk, Admin
 */
router.post(
  '/generate/:agreementId',
  requireRole('FRONT_DESK', 'OWNER_ADMIN', 'ACCOUNTS'),
  InvoiceController.generate
);

/**
 * @route   PATCH /v1/invoices/:id/issue
 * @desc    Issue a draft invoice
 * @access  Front Desk, Admin, Accounts
 */
router.patch(
  '/:id/issue',
  requireRole('FRONT_DESK', 'OWNER_ADMIN', 'ACCOUNTS'),
  InvoiceController.issue
);

/**
 * @route   PATCH /v1/invoices/:id/void
 * @desc    Void an invoice
 * @access  Admin, Accounts
 */
router.patch(
  '/:id/void',
  requireRole('OWNER_ADMIN', 'ACCOUNTS'),
  InvoiceController.void
);

/**
 * @route   GET /v1/invoices
 * @desc    List all invoices
 * @access  Front Desk, Admin, Accounts
 */
router.get(
  '/',
  requireRole('FRONT_DESK', 'OWNER_ADMIN', 'ACCOUNTS'),
  InvoiceController.list
);

/**
 * @route   GET /v1/invoices/:id
 * @desc    Get invoice detail
 * @access  Front Desk, Admin, Accounts
 */
router.get(
  '/:id',
  requireRole('FRONT_DESK', 'OWNER_ADMIN', 'ACCOUNTS'),
  InvoiceController.getById
);

/**
 * @route   POST /v1/invoices/:id/payments
 * @desc    Record payment against invoice
 * @access  Front Desk, Admin, Accounts
 */
router.post(
  '/:id/payments',
  requireRole('FRONT_DESK', 'OWNER_ADMIN', 'ACCOUNTS'),
  InvoiceController.recordPayment
);

export default router;
