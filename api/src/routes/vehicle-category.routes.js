import express from 'express';
import VehicleCategoryModel from '../models/vehicle-category.model.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
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

router.post('/', requireRole('OWNER_ADMIN', 'FLEET_MANAGER'), async (req, res) => {
  try {
    const { category_name, category_code, daily_rate_default, weekly_rate_default } = req.body;
    if (!category_name || !category_code) {
      return res.status(400).json({ error: 'category_name and category_code are required' });
    }
    const category = await VehicleCategoryModel.create({
      tenant_id: req.tenantId,
      category_name,
      category_code: category_code.toUpperCase(),
      daily_rate_default: daily_rate_default ? Number(daily_rate_default) : null,
      weekly_rate_default: weekly_rate_default ? Number(weekly_rate_default) : null,
    });
    res.status(201).json({ success: true, data: category });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Category code already exists' });
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
