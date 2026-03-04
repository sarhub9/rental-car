import express from 'express';
import MaintenanceController from '../controllers/maintenance.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(authenticate);

router.post('/', requireRole('FLEET_MANAGER', 'OWNER_ADMIN', 'SUPER_ADMIN'), (req, res, next) => MaintenanceController.create(req, res, next));
router.get('/', (req, res, next) => MaintenanceController.list(req, res, next));
router.get('/overdue', (req, res, next) => MaintenanceController.overdueVehicles(req, res, next));
router.get('/upcoming', (req, res, next) => MaintenanceController.upcoming(req, res, next));
router.get('/:id', (req, res, next) => MaintenanceController.getById(req, res, next));
router.put('/:id/start', requireRole('FLEET_MANAGER', 'OWNER_ADMIN', 'SUPER_ADMIN'), (req, res, next) => MaintenanceController.start(req, res, next));
router.put('/:id/complete', requireRole('FLEET_MANAGER', 'OWNER_ADMIN', 'SUPER_ADMIN'), (req, res, next) => MaintenanceController.complete(req, res, next));
router.put('/:id/cancel', requireRole('FLEET_MANAGER', 'OWNER_ADMIN', 'SUPER_ADMIN'), (req, res, next) => MaintenanceController.cancel(req, res, next));
router.get('/vehicle/:vehicleId/summary', (req, res, next) => MaintenanceController.vehicleSummary(req, res, next));

export default router;
