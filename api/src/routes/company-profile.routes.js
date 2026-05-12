import express from 'express';
import pool from '../config/database.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { enforceTenantIsolation } from '../middleware/tenant-isolation.middleware.js';
import TenantRulesModel from '../models/tenant-rules.model.js';

const router = express.Router();
router.use(authenticate);
router.use(enforceTenantIsolation);

// Get full company profile (company + tenant rules)
router.get('/', requireRole('OWNER_ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const [company, rules] = await Promise.all([
      pool.query(`SELECT * FROM companies WHERE id = (
        SELECT company_id FROM users WHERE id = $1 LIMIT 1
      )`, [req.user.id]),
      TenantRulesModel.findByTenantId(req.tenantId),
    ]);
    return res.json({ success: true, data: { company: company.rows[0] || null, rules: rules || null } });
  } catch (err) {
    console.error('Profile fetch error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Update company profile
router.patch('/company', requireRole('OWNER_ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const allowed = [
      'name','name_ar','phone_number','address','logo_url','trade_license_number',
      'trn_number','vat_rate','currency','invoice_prefix','invoice_footer',
      'agreement_terms','website','city','country',
    ];
    const fields = []; const values = []; let p = 1;
    for (const key of allowed) {
      if (req.body[key] !== undefined) { fields.push(`${key} = $${p}`); values.push(req.body[key]); p++; }
    }
    if (!fields.length) return res.status(400).json({ error: 'No fields to update' });

    values.push(req.user.id);
    const result = await pool.query(
      `UPDATE companies SET ${fields.join(', ')} WHERE id = (
        SELECT company_id FROM users WHERE id = $${p} LIMIT 1
      ) RETURNING *`,
      values
    );
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Update tenant rules (charge settings)
router.patch('/rules', requireRole('OWNER_ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const allowed = [
      'km_allowance_per_day','rate_per_extra_km','fuel_refill_rate',
      'late_fee_per_hour','grace_period_minutes','cleaning_fee',
      'damage_admin_fee','fine_admin_fee','delivery_fee_per_km',
      'max_discount_pct','require_deposit','require_customer_signature',
      'require_photos_on_checkout','require_photos_on_return',
      'document_expiry_alert_days','overdue_alert_hours',
      'refund_approval_threshold','discount_approval_threshold_pct',
    ];
    const fields = []; const values = []; let p = 1;
    for (const key of allowed) {
      if (req.body[key] !== undefined) { fields.push(`${key} = $${p}`); values.push(req.body[key]); p++; }
    }
    if (!fields.length) return res.status(400).json({ error: 'No fields to update' });

    values.push(req.tenantId);
    let result = await pool.query(
      `UPDATE tenant_rules SET ${fields.join(', ')} WHERE tenant_id = $${p} RETURNING *`,
      values
    );
    if (!result.rows[0]) {
      // create if not exists
      const rules = await TenantRulesModel.create({ tenant_id: req.tenantId });
      result = await pool.query(
        `UPDATE tenant_rules SET ${fields.join(', ')} WHERE tenant_id = $${p} RETURNING *`,
        values
      );
    }
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Rules update error:', err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
