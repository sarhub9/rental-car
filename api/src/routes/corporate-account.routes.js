import express from 'express';
import CorporateAccountController from '../controllers/corporate-account.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { enforceTenantIsolation } from '../middleware/tenant-isolation.middleware.js';

const router = express.Router();
router.use(authenticate);
router.use(enforceTenantIsolation);

router.post('/', requireRole('OWNER_ADMIN', 'ACCOUNTS'), CorporateAccountController.create);
router.get('/', requireRole('OWNER_ADMIN', 'ACCOUNTS'), CorporateAccountController.list);
router.get('/reports/ar-aging', requireRole('OWNER_ADMIN', 'ACCOUNTS'), CorporateAccountController.getARAgingReport);
router.get('/:id', requireRole('OWNER_ADMIN', 'ACCOUNTS'), CorporateAccountController.getById);
router.patch('/:id', requireRole('OWNER_ADMIN', 'ACCOUNTS'), CorporateAccountController.update);

export default router;
