import express from 'express';
import DepositController from '../controllers/deposit.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(authenticate);

router.post('/', (req, res, next) => DepositController.collect(req, res, next));
router.get('/', (req, res, next) => DepositController.list(req, res, next));
router.get('/eligible', requireRole('ACCOUNTS', 'OWNER_ADMIN', 'SUPER_ADMIN'), (req, res, next) => DepositController.eligible(req, res, next));
router.get('/agreement/:agreementId', (req, res, next) => DepositController.getByAgreement(req, res, next));
router.put('/:id/use', requireRole('ACCOUNTS', 'OWNER_ADMIN', 'SUPER_ADMIN'), (req, res, next) => DepositController.use(req, res, next));
router.put('/:id/release', requireRole('ACCOUNTS', 'OWNER_ADMIN', 'SUPER_ADMIN'), (req, res, next) => DepositController.release(req, res, next));
router.put('/:id/forfeit', requireRole('OWNER_ADMIN', 'SUPER_ADMIN'), (req, res, next) => DepositController.forfeit(req, res, next));
router.put('/:id/refund', requireRole('ACCOUNTS', 'OWNER_ADMIN', 'SUPER_ADMIN'), (req, res, next) => DepositController.refund(req, res, next));

export default router;
