import express from 'express';
import pool from '../config/database.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { enforceTenantIsolation } from '../middleware/tenant-isolation.middleware.js';

const router = express.Router();
router.use(authenticate);
router.use(enforceTenantIsolation);

const ROLES = ['OWNER_ADMIN', 'SUPER_ADMIN'];

// List staff
router.get('/', requireRole(...ROLES, 'FLEET_MANAGER'), async (req, res) => {
  try {
    const { branch_id, is_active, q } = req.query;
    let query = `
      SELECT sp.*, b.branch_name, u.email AS user_email, u.role AS user_role
      FROM staff_profiles sp
      LEFT JOIN branches b ON b.id = sp.branch_id
      LEFT JOIN users u ON u.id = sp.user_id
      WHERE sp.tenant_id = $1
    `;
    const values = [req.tenantId];
    let p = 2;
    if (branch_id)             { query += ` AND sp.branch_id = $${p}`; values.push(branch_id); p++; }
    if (is_active !== undefined){ query += ` AND sp.is_active = $${p}`; values.push(is_active === 'true'); p++; }
    if (q)                     { query += ` AND (sp.full_name ILIKE $${p} OR sp.employee_number ILIKE $${p} OR sp.phone_number ILIKE $${p})`; values.push(`%${q}%`); p++; }
    query += ' ORDER BY sp.full_name ASC';
    const result = await pool.query(query, values);
    return res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Staff list error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Create staff
router.post('/', requireRole(...ROLES), async (req, res) => {
  try {
    const d = req.body;
    // Generate employee number
    const last = await pool.query(
      `SELECT employee_number FROM staff_profiles WHERE tenant_id = $1 AND employee_number LIKE 'EMP-%' ORDER BY employee_number DESC LIMIT 1`,
      [req.tenantId]
    );
    const seq = last.rows.length ? parseInt(last.rows[0].employee_number.split('-')[1]) + 1 : 1;
    const empNum = d.employee_number || `EMP-${String(seq).padStart(4, '0')}`;

    const result = await pool.query(
      `INSERT INTO staff_profiles (
         tenant_id, user_id, branch_id, full_name, employee_number, department, job_title,
         phone_number, email, emirates_id, emirates_id_expiry, driving_license, license_expiry,
         visa_number, visa_expiry, date_of_joining, notes
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
      [
        req.tenantId, d.user_id || null, d.branch_id || null, d.full_name, empNum,
        d.department || null, d.job_title || null, d.phone_number || null, d.email || null,
        d.emirates_id || null, d.emirates_id_expiry || null, d.driving_license || null,
        d.license_expiry || null, d.visa_number || null, d.visa_expiry || null,
        d.date_of_joining || null, d.notes || null,
      ]
    );
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Employee number already exists' });
    console.error('Staff create error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Update staff
router.patch('/:id', requireRole(...ROLES), async (req, res) => {
  try {
    const allowed = [
      'branch_id','full_name','department','job_title','phone_number','email',
      'emirates_id','emirates_id_expiry','driving_license','license_expiry',
      'visa_number','visa_expiry','date_of_joining','is_active','notes',
    ];
    const fields = []; const values = []; let p = 1;
    for (const key of allowed) {
      if (req.body[key] !== undefined) { fields.push(`${key} = $${p}`); values.push(req.body[key]); p++; }
    }
    if (!fields.length) return res.status(400).json({ error: 'No fields to update' });
    values.push(req.params.id, req.tenantId);
    const result = await pool.query(
      `UPDATE staff_profiles SET ${fields.join(', ')} WHERE id = $${p} AND tenant_id = $${p+1} RETURNING *`,
      values
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Staff not found' });
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Get by ID
router.get('/:id', requireRole(...ROLES, 'FLEET_MANAGER'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT sp.*, b.branch_name FROM staff_profiles sp LEFT JOIN branches b ON b.id = sp.branch_id WHERE sp.id = $1 AND sp.tenant_id = $2`,
      [req.params.id, req.tenantId]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Staff not found' });
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
