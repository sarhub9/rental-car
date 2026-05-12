import express from 'express';
import ctrl from '../controllers/reports.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { enforceTenantIsolation } from '../middleware/tenant-isolation.middleware.js';

const router = express.Router();
router.use(authenticate);
router.use(enforceTenantIsolation);

const roles = ['OWNER_ADMIN', 'ACCOUNTS', 'SUPER_ADMIN'];

router.get('/vat',              requireRole(...roles), ctrl.vat);
router.get('/revenue',          requireRole(...roles), ctrl.revenue);
router.get('/fleet-utilization',requireRole(...roles), ctrl.fleetUtilization);
router.get('/vehicle-profit',   requireRole(...roles), ctrl.vehicleProfit);
router.get('/maintenance-cost', requireRole(...roles), ctrl.maintenanceCost);
router.get('/damage-recovery',  requireRole(...roles), ctrl.damageRecovery);
router.get('/salik-fines',      requireRole(...roles), ctrl.salikFine);
router.get('/customer-statement/:customerId', requireRole(...roles), ctrl.customerStatement);
router.get('/profit-loss', requireRole(...roles), ctrl.profitLoss);

export default router;
