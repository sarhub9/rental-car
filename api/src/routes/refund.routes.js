import express from 'express';
import RefundController from '../controllers/refund.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { enforceTenantIsolation } from '../middleware/tenant-isolation.middleware.js';

const router = express.Router();
router.use(authenticate);
router.use(enforceTenantIsolation);

router.post('/', requireRole('FRONT_DESK', 'ACCOUNTS', 'OWNER_ADMIN'), RefundController.request);
router.get('/', requireRole('ACCOUNTS', 'OWNER_ADMIN'), RefundController.list);
router.get('/:id', RefundController.getById);
router.post('/:id/approve', requireRole('OWNER_ADMIN', 'ACCOUNTS'), RefundController.approve);
router.post('/:id/reject', requireRole('OWNER_ADMIN', 'ACCOUNTS'), RefundController.reject);
router.post('/:id/process', requireRole('ACCOUNTS', 'OWNER_ADMIN'), RefundController.process);

export default router;
