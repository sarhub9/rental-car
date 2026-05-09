import express from 'express';
import {
  listDrivers, createDriver, getDriver, updateDriver,
  searchDrivers, validateDriverDocs, blacklistDriver, unblacklistDriver,
} from '../controllers/driver-profile.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { enforceTenantIsolation } from '../middleware/tenant-isolation.middleware.js';

const router = express.Router();

router.use(authenticate);
router.use(enforceTenantIsolation);

router.get('/search', searchDrivers);
router.get('/', listDrivers);
router.post('/', requireRole('FRONT_DESK', 'OWNER_ADMIN', 'SUPER_ADMIN'), createDriver);
router.get('/:id', getDriver);
router.patch('/:id', requireRole('FRONT_DESK', 'OWNER_ADMIN', 'SUPER_ADMIN'), updateDriver);
router.get('/:id/validate', validateDriverDocs);
router.post('/:id/blacklist', requireRole('OWNER_ADMIN', 'SUPER_ADMIN'), blacklistDriver);
router.post('/:id/unblacklist', requireRole('OWNER_ADMIN', 'SUPER_ADMIN'), unblacklistDriver);

export default router;
