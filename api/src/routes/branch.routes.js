import express from 'express';
import BranchController from '../controllers/branch.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { enforceTenantIsolation } from '../middleware/tenant-isolation.middleware.js';

const router = express.Router();
router.use(authenticate);
router.use(enforceTenantIsolation);

router.post('/', requireRole('OWNER_ADMIN'), BranchController.create);
router.get('/', BranchController.list);
router.get('/:id', BranchController.getById);
router.patch('/:id', requireRole('OWNER_ADMIN'), BranchController.update);
router.delete('/:id', requireRole('OWNER_ADMIN'), BranchController.deactivate);

export default router;
