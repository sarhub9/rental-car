import express from 'express';
import CustomerController from '../controllers/customer.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { enforceTenantIsolation } from '../middleware/tenant-isolation.middleware.js';
import { validate, createCustomerSchema, updateCustomerSchema } from '../utils/validation.util.js';

const router = express.Router();

router.use(authenticate);
router.use(enforceTenantIsolation);

router.post(
  '/',
  requireRole('FRONT_DESK', 'OWNER_ADMIN'),
  validate(createCustomerSchema),
  CustomerController.create
);

router.get('/search', requireRole('FRONT_DESK', 'OWNER_ADMIN'), CustomerController.search);

router.get('/', requireRole('FRONT_DESK', 'OWNER_ADMIN'), CustomerController.list);

router.get('/:id', requireRole('FRONT_DESK', 'OWNER_ADMIN'), CustomerController.getById);

router.patch(
  '/:id',
  requireRole('OWNER_ADMIN'),
  validate(updateCustomerSchema),
  CustomerController.update
);

export default router;
