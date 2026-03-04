import express from 'express';
import VehicleController from '../controllers/vehicle.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { enforceTenantIsolation } from '../middleware/tenant-isolation.middleware.js';
import { validate, createVehicleSchema, updateVehicleSchema } from '../utils/validation.util.js';

const router = express.Router();

router.use(authenticate);
router.use(enforceTenantIsolation);

router.post(
  '/',
  requireRole('OWNER_ADMIN', 'FLEET_MANAGER'),
  validate(createVehicleSchema),
  VehicleController.create
);

router.get('/available', requireRole('FRONT_DESK', 'OWNER_ADMIN', 'FLEET_MANAGER'), VehicleController.searchAvailable);

router.get('/', requireRole('FRONT_DESK', 'OWNER_ADMIN', 'FLEET_MANAGER'), VehicleController.list);

router.get('/:id', requireRole('FRONT_DESK', 'OWNER_ADMIN', 'FLEET_MANAGER'), VehicleController.getById);

router.patch(
  '/:id',
  requireRole('OWNER_ADMIN', 'FLEET_MANAGER'),
  validate(updateVehicleSchema),
  VehicleController.update
);

export default router;
