import pool from '../config/database.js';

class DisputeModel {
  async create(data) {
    const query = `
      INSERT INTO disputes (
        tenant_id, dispute_number, agreement_id, customer_id,
        charge_id, invoice_id, subject, description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const values = [
      data.tenant_id, data.dispute_number, data.agreement_id, data.customer_id,
      data.charge_id || null, data.invoice_id || null, data.subject, data.description,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async findById(id, tenantId) {
    const query = 'SELECT * FROM disputes WHERE id = $1 AND tenant_id = $2';
    const result = await pool.query(query, [id, tenantId]);
    return result.rows[0];
  }

  async getMessages(disputeId) {
    const query = `
      SELECT * FROM dispute_messages
      WHERE dispute_id = $1
      ORDER BY created_at ASC
    `;
    const result = await pool.query(query, [disputeId]);
    return result.rows;
  }

  async addMessage(data) {
    const query = `
      INSERT INTO dispute_messages (dispute_id, sender_user_id, sender_role, message, attachments)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [
      data.dispute_id, data.sender_user_id, data.sender_role,
      data.message, data.attachments ? JSON.stringify(data.attachments) : null,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async updateStatus(id, tenantId, status, extra = {}) {
    const fields = ['status = $3'];
    const values = [id, tenantId, status];
    let p = 4;

    if (extra.resolved_at) {
      fields.push(`resolved_at = $${p}`);
      values.push(extra.resolved_at);
      p++;
    }
    if (extra.resolution_notes) {
      fields.push(`resolution_notes = $${p}`);
      values.push(extra.resolution_notes);
      p++;
    }
    if (extra.resolved_by_user_id) {
      fields.push(`resolved_by_user_id = $${p}`);
      values.push(extra.resolved_by_user_id);
      p++;
    }

    const query = `
      UPDATE disputes SET ${fields.join(', ')}
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async listByCustomer(customerId, tenantId, filters = {}) {
    let query = 'SELECT * FROM disputes WHERE customer_id = $1 AND tenant_id = $2';
    const values = [customerId, tenantId];
    let p = 3;

    if (filters.status) {
      query += ` AND status = $${p}`;
      values.push(filters.status);
      p++;
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      query += ` LIMIT $${p}`;
      values.push(filters.limit);
      p++;
    }
    if (filters.offset) {
      query += ` OFFSET $${p}`;
      values.push(filters.offset);
    }

    const result = await pool.query(query, values);
    return result.rows;
  }

  async list(tenantId, filters = {}) {
    let query = 'SELECT * FROM disputes WHERE tenant_id = $1';
    const values = [tenantId];
    let p = 2;

    if (filters.status) {
      query += ` AND status = $${p}`;
      values.push(filters.status);
      p++;
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      query += ` LIMIT $${p}`;
      values.push(filters.limit);
      p++;
    }
    if (filters.offset) {
      query += ` OFFSET $${p}`;
      values.push(filters.offset);
    }

    const result = await pool.query(query, values);
    return result.rows;
  }

  async generateDisputeNumber(tenantId) {
    const year = new Date().getFullYear();
    const query = `
      SELECT dispute_number FROM disputes
      WHERE tenant_id = $1 AND dispute_number LIKE $2
      ORDER BY dispute_number DESC LIMIT 1
    `;
    const result = await pool.query(query, [tenantId, `DSP-${year}-%`]);

    if (result.rows.length === 0) return `DSP-${year}-00001`;

    const last = result.rows[0].dispute_number;
    const seq = parseInt(last.split('-')[2]) + 1;
    return `DSP-${year}-${seq.toString().padStart(5, '0')}`;
  }
}

export default new DisputeModel();
