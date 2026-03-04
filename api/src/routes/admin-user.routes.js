import express from 'express';
import AdminUserController from '../controllers/admin-user.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { enforceTenantIsolation } from '../middleware/tenant-isolation.middleware.js';
import { validate, createStaffUserSchema, updateStaffUserSchema } from '../utils/validation.util.js';

const router = express.Router();

// All admin user routes require auth + tenant isolation + OWNER_ADMIN or SUPER_ADMIN role
router.use(authenticate);
router.use(enforceTenantIsolation);
router.use(requireRole('OWNER_ADMIN', 'SUPER_ADMIN'));

/**
 * @route   GET /v1/admin/users
 * @desc    List all users (with filters: role, status, limit, offset)
 * @access  Owner Admin, Super Admin
 */
router.get('/', AdminUserController.list);

/**
 * @route   POST /v1/admin/users
 * @desc    Create a new staff user
 * @access  Owner Admin, Super Admin
 */
router.post('/', validate(createStaffUserSchema), AdminUserController.create);

/**
 * @route   GET /v1/admin/users/:id
 * @desc    Get user by ID
 * @access  Owner Admin, Super Admin
 */
router.get('/:id', AdminUserController.getById);

/**
 * @route   PATCH /v1/admin/users/:id
 * @desc    Update staff user
 * @access  Owner Admin, Super Admin
 */
router.patch('/:id', validate(updateStaffUserSchema), AdminUserController.update);

/**
 * @route   POST /v1/admin/users/:id/deactivate
 * @desc    Deactivate a user
 * @access  Owner Admin, Super Admin
 */
router.post('/:id/deactivate', AdminUserController.deactivate);

/**
 * @route   POST /v1/admin/users/:id/activate
 * @desc    Activate a user
 * @access  Owner Admin, Super Admin
 */
router.post('/:id/activate', AdminUserController.activate);

/**
 * @route   POST /v1/admin/users/:id/reset-password
 * @desc    Trigger password reset for a user
 * @access  Owner Admin, Super Admin
 */
router.post('/:id/reset-password', AdminUserController.resetPassword);

export default router;
