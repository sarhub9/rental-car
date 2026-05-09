import pool from '../config/database.js';

class RefundRequestModel {
  async create(data) {
    const query = `
      INSERT INTO refund_requests (
        tenant_id, refund_number, payment_id, invoice_id, customer_id,
        requested_by_user_id, amount, reason
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *
    `;
    const values = [
      data.tenant_id, data.refund_number, data.payment_id,
      data.invoice_id || null, data.customer_id,
      data.requested_by_user_id, data.amount, data.reason,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async findById(id, tenantId) {
    const result = await pool.query(
      `SELECT rr.*,
         c.full_name_en AS customer_name,
         p.payment_number, p.payment_method AS original_payment_method, p.amount AS original_amount
       FROM refund_requests rr
       JOIN customers c ON c.id = rr.customer_id
       JOIN payments p ON p.id = rr.payment_id
       WHERE rr.id = $1 AND rr.tenant_id = $2`,
      [id, tenantId]
    );
    return result.rows[0];
  }

  async list(tenantId, filters = {}) {
    let query = `
      SELECT rr.*, c.full_name_en AS customer_name, p.payment_number
      FROM refund_requests rr
      JOIN customers c ON c.id = rr.customer_id
      JOIN payments p ON p.id = rr.payment_id
      WHERE rr.tenant_id = $1
    `;
    const values = [tenantId];
    let p = 2;

    if (filters.status) { query += ` AND rr.status = $${p}`; values.push(filters.status); p++; }
    if (filters.customer_id) { query += ` AND rr.customer_id = $${p}`; values.push(filters.customer_id); p++; }

    query += ' ORDER BY rr.created_at DESC';
    if (filters.limit) { query += ` LIMIT $${p}`; values.push(filters.limit); p++; }
    if (filters.offset) { query += ` OFFSET $${p}`; values.push(filters.offset); }

    const result = await pool.query(query, values);
    return result.rows;
  }

  async approve(id, tenantId, approvedByUserId) {
    const result = await pool.query(
      `UPDATE refund_requests SET status = 'APPROVED', approved_by_user_id = $1, approved_at = NOW()
       WHERE id = $2 AND tenant_id = $3 AND status = 'PENDING' RETURNING *`,
      [approvedByUserId, id, tenantId]
    );
    return result.rows[0];
  }

  async reject(id, tenantId, approvedByUserId, rejectionReason) {
    const result = await pool.query(
      `UPDATE refund_requests SET status = 'REJECTED', approved_by_user_id = $1, approved_at = NOW(), rejection_reason = $2
       WHERE id = $3 AND tenant_id = $4 AND status = 'PENDING' RETURNING *`,
      [approvedByUserId, rejectionReason, id, tenantId]
    );
    return result.rows[0];
  }

  async process(id, tenantId, refundMethod, transactionReference) {
    const result = await pool.query(
      `UPDATE refund_requests
       SET status = 'PROCESSED', processed_at = NOW(), refund_method = $1, transaction_reference = $2
       WHERE id = $3 AND tenant_id = $4 AND status = 'APPROVED'
       RETURNING *`,
      [refundMethod, transactionReference || null, id, tenantId]
    );
    return result.rows[0];
  }

  async generateRefundNumber(tenantId) {
    const year = new Date().getFullYear();
    const result = await pool.query(
      `SELECT refund_number FROM refund_requests WHERE tenant_id = $1 AND refund_number LIKE $2 ORDER BY refund_number DESC LIMIT 1`,
      [tenantId, `REF-${year}-%`]
    );
    if (result.rows.length === 0) return `REF-${year}-00001`;
    const seq = parseInt(result.rows[0].refund_number.split('-')[2]) + 1;
    return `REF-${year}-${seq.toString().padStart(5, '0')}`;
  }
}

export default new RefundRequestModel();
