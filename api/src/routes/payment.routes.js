import express from 'express';
import PaymentController from '../controllers/payment.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { enforceTenantIsolation } from '../middleware/tenant-isolation.middleware.js';

const router = express.Router();

router.use(authenticate);
router.use(enforceTenantIsolation);

router.get('/', requireRole('FRONT_DESK', 'OWNER_ADMIN', 'ACCOUNTS'), PaymentController.list);

export default router;
