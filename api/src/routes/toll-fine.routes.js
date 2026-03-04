import express from 'express';
import TollFineController from '../controllers/toll-fine.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(authenticate);

router.post('/import', requireRole('ACCOUNTS', 'OWNER_ADMIN', 'SUPER_ADMIN'), (req, res, next) => TollFineController.importCsv(req, res, next));
router.get('/', (req, res, next) => TollFineController.list(req, res, next));
router.get('/unmatched', (req, res, next) => TollFineController.getUnmatched(req, res, next));
router.put('/:id/assign', requireRole('ACCOUNTS', 'OWNER_ADMIN', 'SUPER_ADMIN'), (req, res, next) => TollFineController.manualAssign(req, res, next));
router.get('/agreement/:agreementId', (req, res, next) => TollFineController.getByAgreement(req, res, next));
router.post('/reprocess', requireRole('OWNER_ADMIN', 'SUPER_ADMIN'), (req, res, next) => TollFineController.reprocess(req, res, next));

export default router;
