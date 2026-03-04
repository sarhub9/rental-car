import express from 'express';
import AdminDashboardController from '../controllers/admin-dashboard.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { enforceTenantIsolation } from '../middleware/tenant-isolation.middleware.js';

const router = express.Router();

router.use(authenticate);
router.use(enforceTenantIsolation);

/**
 * @route   GET /v1/admin/dashboard
 * @desc    Get dashboard KPIs
 * @access  Owner Admin, Super Admin
 */
router.get('/dashboard', requireRole('OWNER_ADMIN', 'SUPER_ADMIN'), AdminDashboardController.getDashboard);

/**
 * @route   GET /v1/admin/reports/revenue
 * @desc    Get revenue summary (query: period=week|month|quarter|year)
 * @access  Owner Admin, Super Admin, Accounts
 */
router.get('/reports/revenue', requireRole('OWNER_ADMIN', 'SUPER_ADMIN', 'ACCOUNTS'), AdminDashboardController.getRevenue);

/**
 * @route   GET /v1/admin/reports/receivables
 * @desc    Get receivables breakdown
 * @access  Owner Admin, Super Admin, Accounts
 */
router.get('/reports/receivables', requireRole('OWNER_ADMIN', 'SUPER_ADMIN', 'ACCOUNTS'), AdminDashboardController.getReceivables);

/**
 * @route   GET /v1/admin/reports/agreements
 * @desc    Get agreement statistics
 * @access  Owner Admin, Super Admin, Accounts, Fleet Manager
 */
router.get('/reports/agreements', requireRole('OWNER_ADMIN', 'SUPER_ADMIN', 'ACCOUNTS', 'FLEET_MANAGER'), AdminDashboardController.getAgreementStats);

/**
 * @route   GET /v1/admin/vehicles/stats
 * @desc    Get vehicle fleet statistics
 * @access  Owner Admin, Super Admin, Fleet Manager
 */
router.get('/vehicles/stats', requireRole('OWNER_ADMIN', 'SUPER_ADMIN', 'FLEET_MANAGER'), AdminDashboardController.getVehicleStats);

export default router;
