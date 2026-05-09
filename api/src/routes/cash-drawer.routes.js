import express from 'express';
import CashDrawerController from '../controllers/cash-drawer.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { enforceTenantIsolation } from '../middleware/tenant-isolation.middleware.js';

const router = express.Router();
router.use(authenticate);
router.use(enforceTenantIsolation);

router.post('/open', requireRole('FRONT_DESK', 'ACCOUNTS', 'OWNER_ADMIN'), CashDrawerController.openSession);
router.get('/current', CashDrawerController.getOpenSession);
router.get('/', requireRole('ACCOUNTS', 'OWNER_ADMIN'), CashDrawerController.list);
router.post('/:id/close', requireRole('FRONT_DESK', 'ACCOUNTS', 'OWNER_ADMIN'), CashDrawerController.closeSession);
router.get('/:id/summary', CashDrawerController.getSessionSummary);

export default router;
