import express from 'express';
import VehicleDocumentController from '../controllers/vehicle-document.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { enforceTenantIsolation } from '../middleware/tenant-isolation.middleware.js';

const router = express.Router({ mergeParams: true });
router.use(authenticate);
router.use(enforceTenantIsolation);

router.post('/', requireRole('FLEET_MANAGER', 'OWNER_ADMIN'), VehicleDocumentController.upload);
router.get('/', VehicleDocumentController.getByVehicle);
router.get('/expiry-alerts', VehicleDocumentController.getExpiryAlerts);
router.get('/:docId', VehicleDocumentController.getById);
router.patch('/:docId', requireRole('FLEET_MANAGER', 'OWNER_ADMIN'), VehicleDocumentController.update);

export default router;
