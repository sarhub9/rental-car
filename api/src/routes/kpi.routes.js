import express from 'express';
import KpiController from '../controllers/kpi.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(authenticate);
router.use(requireRole('OWNER_ADMIN', 'SUPER_ADMIN'));

router.get('/', (req, res, next) => KpiController.getDashboardSummary(req, res, next));
router.get('/fleet', (req, res, next) => KpiController.getFleetKpis(req, res, next));
router.get('/revenue', (req, res, next) => KpiController.getRevenueKpis(req, res, next));
router.get('/risk', (req, res, next) => KpiController.getRiskKpis(req, res, next));
router.get('/profit', (req, res, next) => KpiController.getProfitKpis(req, res, next));
router.get('/summary', (req, res, next) => KpiController.getDashboardSummary(req, res, next));

export default router;
