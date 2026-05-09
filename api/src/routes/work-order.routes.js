import express from 'express';
import WorkOrderController from '../controllers/work-order.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { enforceTenantIsolation } from '../middleware/tenant-isolation.middleware.js';

const router = express.Router();
router.use(authenticate);
router.use(enforceTenantIsolation);

router.post('/', requireRole('FLEET_MANAGER', 'OWNER_ADMIN'), WorkOrderController.create);
router.get('/', WorkOrderController.list);
router.get('/maintenance/due-soon', WorkOrderController.getDueSoon);
router.get('/vehicle/:vehicleId/cost-stats', WorkOrderController.getVehicleCostStats);
router.get('/:id', WorkOrderController.getById);
router.patch('/:id', requireRole('FLEET_MANAGER', 'OWNER_ADMIN'), WorkOrderController.update);
router.post('/:id/line-items', requireRole('FLEET_MANAGER', 'OWNER_ADMIN'), WorkOrderController.addLineItem);
router.post('/schedules', requireRole('FLEET_MANAGER', 'OWNER_ADMIN'), WorkOrderController.createSchedule);

export default router;
