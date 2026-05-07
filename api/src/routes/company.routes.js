import express from 'express';
import {
  register, getPlans, getMyCompany, updateMyCompany,
  subscribe, listCompanies, getCompanyById, updateCompanyStatus,
} from '../controllers/company.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { enforceTenantIsolation } from '../middleware/tenant-isolation.middleware.js';
import { validate, companyRegisterSchema, updateCompanySchema, subscribeSchema } from '../utils/validation.util.js';

const router = express.Router();

// Public routes (no authentication required)
router.post('/', validate(companyRegisterSchema), register);
router.get('/plans', getPlans);

// Authenticated company routes
router.use(authenticate);
router.use(enforceTenantIsolation);

router.get('/me', getMyCompany);
router.patch('/me', validate(updateCompanySchema), updateMyCompany);
router.post('/subscribe', validate(subscribeSchema), subscribe);

// Super admin routes
router.get('/super-admin/companies', requireRole('SUPER_ADMIN'), listCompanies);
router.get('/super-admin/companies/:id', requireRole('SUPER_ADMIN'), getCompanyById);
router.patch('/super-admin/companies/:id/status', requireRole('SUPER_ADMIN'), updateCompanyStatus);

export default router;
