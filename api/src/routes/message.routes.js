import express from 'express';
import MessageController from '../controllers/message.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { enforceTenantIsolation } from '../middleware/tenant-isolation.middleware.js';

const router = express.Router();

router.use(authenticate);
router.use(requireRole('OWNER_ADMIN', 'FRONT_DESK', 'ACCOUNTS', 'FLEET_MANAGER', 'SUPER_ADMIN'));
router.use(enforceTenantIsolation);

router.get('/', MessageController.listThreads);
router.get('/:id', MessageController.getThread);
router.post('/:id/messages', MessageController.addAdminMessage);
router.patch('/:id/close', MessageController.closeThread);
router.patch('/:id/reopen', MessageController.reopenThread);

export default router;
