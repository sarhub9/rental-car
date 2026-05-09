import express from 'express';
import {
  register, getPlans, getMyCompany, updateMyCompany,
  subscribe, listCompanies, getCompanyById, updateCompanyStatus,
  createPlan, updatePlan, togglePlanStatus, getAllPlans,
} from '../controllers/company.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { enforceTenantIsolation } from '../middleware/tenant-isolation.middleware.js';
import { validate, companyRegisterSchema, updateCompanySchema, subscribeSchema } from '../utils/validation.util.js';

const router = express.Router();

// Public routes (no authentication required)
router.post('/', validate(companyRegisterSchema), register);
router.get('/plans', getPlans);

// All authenticated routes need the token
router.use(authenticate);

// Super admin routes — need auth but NOT tenant isolation (no tenantId on SUPER_ADMIN)
router.get('/super-admin/companies', requireRole('SUPER_ADMIN'), listCompanies);
router.get('/super-admin/companies/:id', requireRole('SUPER_ADMIN'), getCompanyById);
router.patch('/super-admin/companies/:id/status', requireRole('SUPER_ADMIN'), updateCompanyStatus);
router.get('/super-admin/plans', requireRole('SUPER_ADMIN'), getAllPlans);
router.post('/super-admin/plans', requireRole('SUPER_ADMIN'), createPlan);
router.patch('/super-admin/plans/:id', requireRole('SUPER_ADMIN'), updatePlan);
router.patch('/super-admin/plans/:id/toggle', requireRole('SUPER_ADMIN'), togglePlanStatus);

// Tenant-scoped routes (require tenantId in JWT)
router.use(enforceTenantIsolation);

router.get('/me', getMyCompany);
router.patch('/me', validate(updateCompanySchema), updateMyCompany);
router.post('/subscribe', validate(subscribeSchema), subscribe);

export default router;
