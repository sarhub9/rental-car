import express from 'express';
import VehicleCategoryModel from '../models/vehicle-category.model.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { enforceTenantIsolation } from '../middleware/tenant-isolation.middleware.js';

const router = express.Router();
router.use(authenticate);
router.use(enforceTenantIsolation);

router.get('/', async (req, res) => {
  try {
    const categories = await VehicleCategoryModel.list(req.tenantId);
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
