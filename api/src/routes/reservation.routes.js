import express from 'express';
import ReservationController from '../controllers/reservation.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { enforceTenantIsolation } from '../middleware/tenant-isolation.middleware.js';

const router = express.Router();
router.use(authenticate);
router.use(enforceTenantIsolation);

router.post('/', requireRole('FRONT_DESK', 'OWNER_ADMIN'), ReservationController.create);
router.get('/', ReservationController.list);
router.get('/:id', ReservationController.getById);
router.patch('/:id', requireRole('FRONT_DESK', 'OWNER_ADMIN'), ReservationController.update);
router.patch('/:id/signature', requireRole('FRONT_DESK', 'OWNER_ADMIN'), ReservationController.saveSignature);
router.post('/:id/confirm', requireRole('FRONT_DESK', 'OWNER_ADMIN'), ReservationController.confirm);
router.post('/:id/assign-vehicle', requireRole('FRONT_DESK', 'OWNER_ADMIN'), ReservationController.assignVehicle);
router.post('/:id/cancel', requireRole('FRONT_DESK', 'OWNER_ADMIN'), ReservationController.cancel);
router.post('/:id/no-show', requireRole('FRONT_DESK', 'OWNER_ADMIN'), ReservationController.markNoShow);

export default router;
