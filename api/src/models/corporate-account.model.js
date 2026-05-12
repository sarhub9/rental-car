import pool from '../config/database.js';

class CorporateAccountModel {
  async create(data) {
    const query = `
      INSERT INTO corporate_accounts (
        tenant_id, account_number, company_name, company_name_ar,
        trade_license_number, vat_number, credit_limit, payment_terms_days,
        contact_person, phone, email, billing_address, created_by_user_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING *
    `;
    const values = [
      data.tenant_id, data.account_number, data.company_name, data.company_name_ar || null,
      data.trade_license_number || null, data.vat_number || null,
      data.credit_limit || 0, data.payment_terms_days || 30,
      data.contact_person || null, data.phone || null, data.email || null,
      data.billing_address || null, data.created_by_user_id,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async findById(id, tenantId) {
    const result = await pool.query(
      'SELECT * FROM corporate_accounts WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    return result.rows[0];
  }

  async list(tenantId, filters = {}) {
    console.log('[CorporateAccount.list] tenantId:', tenantId, 'filters:', filters);
    try {
      const result = await pool.query(
        'SELECT * FROM corporate_accounts WHERE tenant_id = $1 ORDER BY company_name ASC',
        [tenantId]
      );
      console.log('[CorporateAccount.list] rows returned:', result.rows.length);
      return result.rows;
    } catch (err) {
      console.error('[CorporateAccount.list] DB error:', err.message, err.code);
      throw err;
    }
  }

  async update(id, tenantId, data) {
    const fields = [];
    const values = [];
    let p = 1;

    const allowed = [
      'company_name', 'company_name_ar', 'trade_license_number', 'vat_number',
      'credit_limit', 'payment_terms_days', 'contact_person', 'phone', 'email',
      'billing_address', 'is_active',
    ];

    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${p}`);
        values.push(data[key]);
        p++;
      }
    }

    if (fields.length === 0) throw new Error('No fields to update');

    values.push(id, tenantId);
    const query = `UPDATE corporate_accounts SET ${fields.join(', ')} WHERE id = $${p} AND tenant_id = $${p + 1} RETURNING *`;
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async incrementCreditUsed(id, tenantId, amount) {
    const result = await pool.query(
      `UPDATE corporate_accounts SET credit_used = credit_used + $1
       WHERE id = $2 AND tenant_id = $3 RETURNING *`,
      [amount, id, tenantId]
    );
    return result.rows[0];
  }

  async decrementCreditUsed(id, tenantId, amount) {
    const result = await pool.query(
      `UPDATE corporate_accounts SET credit_used = GREATEST(0, credit_used - $1)
       WHERE id = $2 AND tenant_id = $3 RETURNING *`,
      [amount, id, tenantId]
    );
    return result.rows[0];
  }

  async generateAccountNumber(tenantId) {
    const result = await pool.query(
      `SELECT account_number FROM corporate_accounts WHERE tenant_id = $1
       ORDER BY account_number DESC LIMIT 1`,
      [tenantId]
    );
    if (result.rows.length === 0) return 'CORP-00001';
    const last = result.rows[0].account_number;
    const seq = parseInt(last.split('-')[1]) + 1;
    return `CORP-${seq.toString().padStart(5, '0')}`;
  }

  // A/R aging report
  async getARAgingReport(tenantId) {
    const query = `
      SELECT
        ca.id, ca.account_number, ca.company_name,
        ca.credit_limit, ca.credit_used, ca.payment_terms_days,
        COALESCE(SUM(CASE WHEN i.due_date >= CURRENT_DATE THEN i.balance_due ELSE 0 END), 0) as current_due,
        COALESCE(SUM(CASE WHEN i.due_date < CURRENT_DATE AND i.due_date >= CURRENT_DATE - 30 THEN i.balance_due ELSE 0 END), 0) as overdue_1_30,
        COALESCE(SUM(CASE WHEN i.due_date < CURRENT_DATE - 30 AND i.due_date >= CURRENT_DATE - 60 THEN i.balance_due ELSE 0 END), 0) as overdue_31_60,
        COALESCE(SUM(CASE WHEN i.due_date < CURRENT_DATE - 60 AND i.due_date >= CURRENT_DATE - 90 THEN i.balance_due ELSE 0 END), 0) as overdue_61_90,
        COALESCE(SUM(CASE WHEN i.due_date < CURRENT_DATE - 90 THEN i.balance_due ELSE 0 END), 0) as overdue_90_plus
      FROM corporate_accounts ca
      LEFT JOIN customers cust ON cust.corporate_account_id = ca.id
      LEFT JOIN invoices i ON i.customer_id = cust.id AND i.tenant_id = $1
        AND i.status IN ('ISSUED','PARTIALLY_PAID','OVERDUE')
      WHERE ca.tenant_id = $1 AND ca.is_active = TRUE
      GROUP BY ca.id
      ORDER BY ca.company_name
    `;
    const result = await pool.query(query, [tenantId]);
    return result.rows;
  }
}

export default new CorporateAccountModel();
