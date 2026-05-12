import pool from '../config/database.js';

class ExpenseModel {
  async create(data) {
    const result = await pool.query(
      `INSERT INTO expenses (
         tenant_id, expense_number, category, description, amount, vat_amount,
         total_amount, payment_method, vendor_name, reference_number, expense_date,
         vehicle_id, branch_id, receipt_url, notes, created_by_user_id
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [
        data.tenant_id, data.expense_number, data.category, data.description,
        data.amount, data.vat_amount || 0,
        data.total_amount || (parseFloat(data.amount) + parseFloat(data.vat_amount || 0)),
        data.payment_method || null, data.vendor_name || null, data.reference_number || null,
        data.expense_date || new Date().toISOString().split('T')[0],
        data.vehicle_id || null, data.branch_id || null,
        data.receipt_url || null, data.notes || null, data.created_by_user_id,
      ]
    );
    return result.rows[0];
  }

  async list(tenantId, filters = {}) {
    let query = `
      SELECT e.*, v.plate_number, v.make, v.model, b.branch_name
      FROM expenses e
      LEFT JOIN vehicles v ON v.id = e.vehicle_id
      LEFT JOIN branches b ON b.id = e.branch_id
      WHERE e.tenant_id = $1
    `;
    const values = [tenantId];
    let p = 2;

    if (filters.category)   { query += ` AND e.category = $${p}`; values.push(filters.category); p++; }
    if (filters.branch_id)  { query += ` AND e.branch_id = $${p}`; values.push(filters.branch_id); p++; }
    if (filters.vehicle_id) { query += ` AND e.vehicle_id = $${p}`; values.push(filters.vehicle_id); p++; }
    if (filters.date_from)  { query += ` AND e.expense_date >= $${p}`; values.push(filters.date_from); p++; }
    if (filters.date_to)    { query += ` AND e.expense_date <= $${p}`; values.push(filters.date_to); p++; }

    query += ' ORDER BY e.expense_date DESC, e.created_at DESC';
    if (filters.limit)  { query += ` LIMIT $${p}`;  values.push(filters.limit);  p++; }
    if (filters.offset) { query += ` OFFSET $${p}`; values.push(filters.offset); }

    const result = await pool.query(query, values);
    return result.rows;
  }

  async findById(id, tenantId) {
    const result = await pool.query(
      `SELECT e.*, v.plate_number, b.branch_name
       FROM expenses e
       LEFT JOIN vehicles v ON v.id = e.vehicle_id
       LEFT JOIN branches b ON b.id = e.branch_id
       WHERE e.id = $1 AND e.tenant_id = $2`,
      [id, tenantId]
    );
    return result.rows[0];
  }

  async summary(tenantId, dateFrom, dateTo) {
    const result = await pool.query(
      `SELECT category,
              COUNT(*)::int                     AS count,
              COALESCE(SUM(amount),0)::numeric  AS total_amount,
              COALESCE(SUM(vat_amount),0)::numeric AS total_vat
       FROM expenses
       WHERE tenant_id = $1
         AND expense_date BETWEEN $2::date AND $3::date
       GROUP BY category ORDER BY total_amount DESC`,
      [tenantId, dateFrom, dateTo]
    );
    return result.rows;
  }

  async generateExpenseNumber(tenantId) {
    const year = new Date().getFullYear();
    const result = await pool.query(
      `SELECT expense_number FROM expenses WHERE tenant_id = $1 AND expense_number LIKE $2
       ORDER BY expense_number DESC LIMIT 1`,
      [tenantId, `EXP-${year}-%`]
    );
    if (!result.rows.length) return `EXP-${year}-00001`;
    const seq = parseInt(result.rows[0].expense_number.split('-')[2]) + 1;
    return `EXP-${year}-${seq.toString().padStart(5, '0')}`;
  }
}

export default new ExpenseModel();
