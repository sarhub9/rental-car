import express from 'express';
import { validate } from '../utils/validation.util.js';
import { featureRequestSchema } from '../utils/validation.util.js';
import { submit, listRequests, updateStatus } from '../controllers/feature-request.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @route   POST /v1/feature-requests
 * @desc    Submit a feature request (public or authenticated)
 * @access  Public (authenticated users auto-fill company info)
 */
router.post('/', validate(featureRequestSchema), submit);

/**
 * @route   GET /v1/feature-requests
 * @desc    List feature requests
 * @access  SUPER_ADMIN only
 */
router.get(
  '/',
  authenticate,
  requireRole('SUPER_ADMIN'),
  listRequests
);

/**
 * @route   PATCH /v1/feature-requests/:id/status
 * @desc    Update feature request status
 * @access  SUPER_ADMIN only
 */
router.patch(
  '/:id/status',
  authenticate,
  requireRole('SUPER_ADMIN'),
  updateStatus
);

export default router;
