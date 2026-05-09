import express from 'express';
import TollEventController from '../controllers/toll-event.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { enforceTenantIsolation } from '../middleware/tenant-isolation.middleware.js';

const router = express.Router();
router.use(authenticate);
router.use(enforceTenantIsolation);

router.post('/', requireRole('OWNER_ADMIN', 'ACCOUNTS', 'FRONT_DESK'), TollEventController.create);
router.post('/bulk-import', requireRole('OWNER_ADMIN', 'ACCOUNTS'), TollEventController.bulkImport);
router.get('/', TollEventController.list);
router.get('/summary', TollEventController.getSummary);
router.get('/:id', TollEventController.getById);
router.post('/:id/attribute', requireRole('OWNER_ADMIN', 'ACCOUNTS', 'FRONT_DESK'), TollEventController.manualAttribute);
router.post('/:id/waive', requireRole('OWNER_ADMIN', 'ACCOUNTS'), TollEventController.waive);

export default router;
