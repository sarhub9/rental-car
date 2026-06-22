import pool from '../config/database.js';

class PaymentModel {
  async create(data) {
    const query = `
      INSERT INTO payments (
        tenant_id, payment_number, invoice_id, agreement_id, customer_id,
        amount, payment_method, payment_status,
        transaction_reference, payment_date, notes, received_by_user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    const values = [
      data.tenant_id, data.payment_number, data.invoice_id || null,
      data.agreement_id || null, data.customer_id,
      data.amount, data.payment_method, data.payment_status || 'COMPLETED',
      data.transaction_reference || null, data.payment_date || new Date(),
      data.notes || null, data.received_by_user_id || null,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async listByAgreement(agreementId, tenantId) {
    const query = `
      SELECT * FROM payments
      WHERE agreement_id = $1 AND tenant_id = $2
      ORDER BY payment_date DESC
    `;
    const result = await pool.query(query, [agreementId, tenantId]);
    return result.rows;
  }

  async findById(id, tenantId) {
    const query = 'SELECT * FROM payments WHERE id = $1 AND tenant_id = $2';
    const result = await pool.query(query, [id, tenantId]);
    return result.rows[0];
  }

  async listByInvoice(invoiceId, tenantId) {
    const query = `
      SELECT * FROM payments
      WHERE invoice_id = $1 AND tenant_id = $2
      ORDER BY payment_date DESC
    `;
    const result = await pool.query(query, [invoiceId, tenantId]);
    return result.rows;
  }

  async listByCustomer(customerId, tenantId, filters = {}) {
    let query = 'SELECT * FROM payments WHERE customer_id = $1 AND tenant_id = $2';
    const values = [customerId, tenantId];
    let p = 3;

    if (filters.status) {
      query += ` AND payment_status = $${p}`;
      values.push(filters.status);
      p++;
    }

    query += ' ORDER BY payment_date DESC';

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

  async generatePaymentNumber(tenantId) {
    const year = new Date().getFullYear();
    const query = `
      SELECT payment_number FROM payments
      WHERE tenant_id = $1 AND payment_number LIKE $2
      ORDER BY payment_number DESC LIMIT 1
    `;
    const result = await pool.query(query, [tenantId, `PAY-${year}-%`]);

    if (result.rows.length === 0) return `PAY-${year}-00001`;

    const last = result.rows[0].payment_number;
    const seq = parseInt(last.split('-')[2]) + 1;
    return `PAY-${year}-${seq.toString().padStart(5, '0')}`;
  }
}

export default new PaymentModel();
