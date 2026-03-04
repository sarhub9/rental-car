import pool from '../config/database.js';

class InvoiceModel {
  async create(data) {
    const query = `
      INSERT INTO invoices (
        tenant_id, invoice_number, agreement_id, customer_id,
        subtotal, vat_rate, vat_amount, total_amount, balance_due,
        status, due_date, created_by_user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    const values = [
      data.tenant_id, data.invoice_number, data.agreement_id, data.customer_id,
      data.subtotal, data.vat_rate, data.vat_amount, data.total_amount, data.balance_due,
      data.status || 'DRAFT', data.due_date, data.created_by_user_id,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async createLineItem(data) {
    const query = `
      INSERT INTO invoice_line_items (
        invoice_id, line_number, description_en, description_ar,
        quantity, unit_price, amount, charge_id, charge_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const values = [
      data.invoice_id, data.line_number, data.description_en, data.description_ar || null,
      data.quantity, data.unit_price, data.amount, data.charge_id || null, data.charge_type || null,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async findById(id, tenantId) {
    const query = 'SELECT * FROM invoices WHERE id = $1 AND tenant_id = $2';
    const result = await pool.query(query, [id, tenantId]);
    return result.rows[0];
  }

  async findByAgreementId(agreementId, tenantId) {
    const query = 'SELECT * FROM invoices WHERE agreement_id = $1 AND tenant_id = $2';
    const result = await pool.query(query, [agreementId, tenantId]);
    return result.rows[0];
  }

  async getLineItems(invoiceId) {
    const query = 'SELECT * FROM invoice_line_items WHERE invoice_id = $1 ORDER BY line_number';
    const result = await pool.query(query, [invoiceId]);
    return result.rows;
  }

  async getWithLineItems(invoiceId, tenantId) {
    const invoice = await this.findById(invoiceId, tenantId);
    if (!invoice) return null;

    const lineItems = await this.getLineItems(invoiceId);
    return { ...invoice, line_items: lineItems };
  }

  async updateStatus(invoiceId, tenantId, status, extra = {}) {
    const fields = ['status = $3'];
    const values = [invoiceId, tenantId, status];
    let p = 4;

    if (extra.issued_at) {
      fields.push(`issued_at = $${p}`);
      values.push(extra.issued_at);
      p++;
    }
    if (extra.voided_at) {
      fields.push(`voided_at = $${p}`);
      values.push(extra.voided_at);
      p++;
    }
    if (extra.void_reason) {
      fields.push(`void_reason = $${p}`);
      values.push(extra.void_reason);
      p++;
    }
    if (extra.amount_paid !== undefined) {
      fields.push(`amount_paid = $${p}`);
      values.push(extra.amount_paid);
      p++;
    }
    if (extra.balance_due !== undefined) {
      fields.push(`balance_due = $${p}`);
      values.push(extra.balance_due);
      p++;
    }

    const query = `
      UPDATE invoices SET ${fields.join(', ')}
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async list(tenantId, filters = {}) {
    let query = 'SELECT * FROM invoices WHERE tenant_id = $1';
    const values = [tenantId];
    let p = 2;

    if (filters.customer_id) {
      query += ` AND customer_id = $${p}`;
      values.push(filters.customer_id);
      p++;
    }
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

  async generateInvoiceNumber(tenantId) {
    const year = new Date().getFullYear();
    const query = `
      SELECT invoice_number FROM invoices
      WHERE tenant_id = $1 AND invoice_number LIKE $2
      ORDER BY invoice_number DESC LIMIT 1
    `;
    const result = await pool.query(query, [tenantId, `INV-${year}-%`]);

    if (result.rows.length === 0) return `INV-${year}-00001`;

    const last = result.rows[0].invoice_number;
    const seq = parseInt(last.split('-')[2]) + 1;
    return `INV-${year}-${seq.toString().padStart(5, '0')}`;
  }
}

export default new InvoiceModel();
