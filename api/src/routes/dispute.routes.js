import express from 'express';
import DisputeController from '../controllers/dispute.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { enforceTenantIsolation } from '../middleware/tenant-isolation.middleware.js';

const router = express.Router();

router.use(authenticate);
router.use(enforceTenantIsolation);

// ---- Admin/Front Desk Routes ----

/**
 * @route   GET /v1/disputes
 * @desc    List all disputes
 * @access  Front Desk, Admin
 */
router.get(
  '/',
  requireRole('FRONT_DESK', 'OWNER_ADMIN', 'ACCOUNTS'),
  DisputeController.listDisputes
);

/**
 * @route   PATCH /v1/disputes/:id/status
 * @desc    Update dispute status
 * @access  Front Desk, Admin
 */
router.patch(
  '/:id/status',
  requireRole('FRONT_DESK', 'OWNER_ADMIN'),
  DisputeController.updateDisputeStatus
);

/**
 * @route   POST /v1/disputes/:id/messages
 * @desc    Add admin response to dispute
 * @access  Front Desk, Admin
 */
router.post(
  '/:id/messages',
  requireRole('FRONT_DESK', 'OWNER_ADMIN'),
  DisputeController.addAdminMessage
);

export default router;
