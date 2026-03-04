import express from 'express';
import RatePlanController from '../controllers/rate-plan.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.post('/', requireRole('OWNER_ADMIN', 'SUPER_ADMIN'), (req, res, next) => RatePlanController.create(req, res, next));
router.get('/', (req, res, next) => RatePlanController.list(req, res, next));
router.get('/:id', (req, res, next) => RatePlanController.getById(req, res, next));
router.put('/:id', requireRole('OWNER_ADMIN', 'SUPER_ADMIN'), (req, res, next) => RatePlanController.updateVersion(req, res, next));
router.delete('/:id', requireRole('OWNER_ADMIN', 'SUPER_ADMIN'), (req, res, next) => RatePlanController.deactivate(req, res, next));

export default router;
