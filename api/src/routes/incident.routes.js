import express from 'express';
import IncidentController from '../controllers/incident.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { enforceTenantIsolation } from '../middleware/tenant-isolation.middleware.js';

const router = express.Router();
router.use(authenticate);
router.use(enforceTenantIsolation);

router.post('/', requireRole('FRONT_DESK', 'FLEET_MANAGER', 'OWNER_ADMIN', 'DRIVER_RECOVERY'), IncidentController.create);
router.get('/', IncidentController.list);
router.get('/:id', IncidentController.getById);
router.patch('/:id', requireRole('FRONT_DESK', 'FLEET_MANAGER', 'OWNER_ADMIN'), IncidentController.update);
router.post('/:id/photos', IncidentController.addPhoto);
router.get('/:id/photos', IncidentController.getPhotos);

export default router;
