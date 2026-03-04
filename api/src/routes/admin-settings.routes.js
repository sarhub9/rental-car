import express from 'express';
import AdminAuditLogController from '../controllers/admin-audit-log.controller.js';
import AdminSettingsController from '../controllers/admin-settings.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { enforceTenantIsolation } from '../middleware/tenant-isolation.middleware.js';
import { validate, updateSettingsSchema } from '../utils/validation.util.js';

const router = express.Router();

// All routes require auth + tenant isolation + admin role
router.use(authenticate);
router.use(enforceTenantIsolation);
router.use(requireRole('OWNER_ADMIN', 'SUPER_ADMIN'));

/**
 * @route   GET /v1/admin/audit-logs
 * @desc    List audit logs with filters (event_type, user_id, start_date, end_date, limit, offset)
 * @access  Owner Admin, Super Admin
 */
router.get('/audit-logs', AdminAuditLogController.list);

/**
 * @route   GET /v1/admin/settings
 * @desc    Get tenant settings (rules)
 * @access  Owner Admin, Super Admin
 */
router.get('/settings', AdminSettingsController.getSettings);

/**
 * @route   PATCH /v1/admin/settings
 * @desc    Update tenant settings (rules)
 * @access  Owner Admin, Super Admin
 */
router.patch('/settings', validate(updateSettingsSchema), AdminSettingsController.updateSettings);

export default router;
