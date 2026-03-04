import pool from '../config/database.js';

const VALID_TRANSITIONS = {
  HELD: ['USED', 'RELEASED', 'FORFEITED'],
  RELEASED: ['REFUNDED'],
  USED: [],
  FORFEITED: [],
  REFUNDED: [],
};

class DepositModel {
  async create(data) {
    const query = `
      INSERT INTO deposits (
        tenant_id, agreement_id, customer_id, amount, status,
        collected_at, policy_delay_days, release_eligible_at,
        payment_method, notes, processed_by_user_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *
    `;
    const values = [
      data.tenant_id, data.agreement_id, data.customer_id, data.amount,
      data.status || 'HELD', data.collected_at || new Date(),
      data.policy_delay_days || 7, data.release_eligible_at,
      data.payment_method, data.notes, data.processed_by_user_id,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async findById(id, tenantId) {
    const query = 'SELECT * FROM deposits WHERE id = $1 AND tenant_id = $2';
    const result = await pool.query(query, [id, tenantId]);
    return result.rows[0];
  }

  async findByAgreementId(agreementId, tenantId) {
    const query = 'SELECT * FROM deposits WHERE agreement_id = $1 AND tenant_id = $2 ORDER BY created_at DESC';
    const result = await pool.query(query, [agreementId, tenantId]);
    return result.rows;
  }

  async findByCustomerId(customerId, tenantId) {
    const query = 'SELECT * FROM deposits WHERE customer_id = $1 AND tenant_id = $2 ORDER BY created_at DESC';
    const result = await pool.query(query, [customerId, tenantId]);
    return result.rows;
  }

  async updateStatus(id, tenantId, newStatus, updateData = {}) {
    const existing = await this.findById(id, tenantId);
    if (!existing) throw new Error('Deposit not found');

    const allowed = VALID_TRANSITIONS[existing.status];
    if (!allowed || !allowed.includes(newStatus)) {
      const error = new Error(`Invalid transition: ${existing.status} → ${newStatus}`);
      error.statusCode = 409;
      throw error;
    }

    const fields = ['status = $1'];
    const values = [newStatus];
    let p = 2;

    const extraFields = ['amount_used', 'amount_released', 'released_at', 'forfeited_at', 'refunded_at', 'notes', 'processed_by_user_id'];
    for (const key of extraFields) {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = $${p}`);
        values.push(updateData[key]);
        p++;
      }
    }

    values.push(id, tenantId);
    const query = `UPDATE deposits SET ${fields.join(', ')} WHERE id = $${p} AND tenant_id = $${p + 1} RETURNING *`;
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async list(tenantId, filters = {}) {
    let query = `
      SELECT d.*, ra.agreement_number, c.full_name_en as customer_name
      FROM deposits d
      LEFT JOIN rental_agreements ra ON ra.id = d.agreement_id
      LEFT JOIN customers c ON c.id = d.customer_id
      WHERE d.tenant_id = $1
    `;
    const values = [tenantId];
    let p = 2;

    if (filters.status) { query += ` AND d.status = $${p}`; values.push(filters.status); p++; }
    if (filters.customer_id) { query += ` AND d.customer_id = $${p}`; values.push(filters.customer_id); p++; }
    query += ' ORDER BY d.created_at DESC';
    if (filters.limit) { query += ` LIMIT $${p}`; values.push(filters.limit); p++; }
    if (filters.offset) { query += ` OFFSET $${p}`; values.push(filters.offset); }

    const result = await pool.query(query, values);
    return result.rows;
  }

  async getDepositsForRelease(tenantId) {
    const query = `
      SELECT d.*, ra.agreement_number, ra.status as agreement_status
      FROM deposits d
      JOIN rental_agreements ra ON ra.id = d.agreement_id
      WHERE d.tenant_id = $1
        AND d.status = 'HELD'
        AND d.release_eligible_at <= NOW()
        AND ra.status = 'CLOSED'
      ORDER BY d.release_eligible_at
    `;
    const result = await pool.query(query, [tenantId]);
    return result.rows;
  }
}

export default new DepositModel();
