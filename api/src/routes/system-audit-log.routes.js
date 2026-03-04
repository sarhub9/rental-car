import express from 'express';
import SystemAuditLogController from '../controllers/system-audit-log.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(authenticate);
router.use(requireRole('OWNER_ADMIN', 'SUPER_ADMIN'));

router.get('/', (req, res, next) => SystemAuditLogController.list(req, res, next));
router.get('/export', (req, res, next) => SystemAuditLogController.exportCsv(req, res, next));

export default router;
