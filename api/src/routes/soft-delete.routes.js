import express from 'express';
import pool from '../config/database.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { enforceTenantIsolation } from '../middleware/tenant-isolation.middleware.js';

const router = express.Router();
router.use(authenticate);
router.use(enforceTenantIsolation);
router.use(requireRole('OWNER_ADMIN', 'SUPER_ADMIN'));

const ALLOWED = {
  invoices:          { table: 'invoices',          guard: `status NOT IN ('ISSUED','PARTIALLY_PAID','OVERDUE')` },
  expenses:          { table: 'expenses',           guard: null },
  refund_requests:   { table: 'refund_requests',    guard: `status IN ('PENDING')` },
  customers:         { table: 'customers',          guard: null },
};

// Soft delete a record
router.delete('/:resource/:id', async (req, res) => {
  const { resource, id } = req.params;
  const config = ALLOWED[resource];
  if (!config) return res.status(400).json({ error: 'Resource not supported for soft delete' });

  try {
    let query = `UPDATE ${config.table} SET deleted_at = NOW() WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`;
    if (config.guard) query += ` AND (${config.guard})`;
    query += ' RETURNING id';
    const result = await pool.query(query, [id, req.tenantId]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Record not found or cannot be deleted' });
    return res.json({ success: true, message: 'Record deleted (soft)' });
  } catch (err) {
    console.error('Soft delete error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Restore a soft-deleted record
router.post('/:resource/:id/restore', async (req, res) => {
  const { resource, id } = req.params;
  const config = ALLOWED[resource];
  if (!config) return res.status(400).json({ error: 'Resource not supported' });

  try {
    const result = await pool.query(
      `UPDATE ${config.table} SET deleted_at = NULL WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NOT NULL RETURNING id`,
      [id, req.tenantId]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Record not found or not deleted' });
    return res.json({ success: true, message: 'Record restored' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// List deleted records for a resource
router.get('/:resource/deleted', async (req, res) => {
  const { resource } = req.params;
  const config = ALLOWED[resource];
  if (!config) return res.status(400).json({ error: 'Resource not supported' });

  try {
    const result = await pool.query(
      `SELECT * FROM ${config.table} WHERE tenant_id = $1 AND deleted_at IS NOT NULL ORDER BY deleted_at DESC LIMIT 100`,
      [req.tenantId]
    );
    return res.json({ success: true, data: result.rows });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
