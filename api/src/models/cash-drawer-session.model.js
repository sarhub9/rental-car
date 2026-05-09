import pool from '../config/database.js';

class CashDrawerSessionModel {
  async open(data) {
    const result = await pool.query(
      `INSERT INTO cash_drawer_sessions
       (tenant_id, branch_id, session_date, opened_by_user_id, opening_balance, status)
       VALUES ($1,$2,$3,$4,$5,'OPEN') RETURNING *`,
      [data.tenant_id, data.branch_id || null, data.session_date, data.opened_by_user_id, data.opening_balance || 0]
    );
    return result.rows[0];
  }

  async findById(id, tenantId) {
    const result = await pool.query(
      'SELECT * FROM cash_drawer_sessions WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    return result.rows[0];
  }

  async findOpenSession(tenantId, branchId = null) {
    let query = `SELECT * FROM cash_drawer_sessions WHERE tenant_id = $1 AND status = 'OPEN'`;
    const values = [tenantId];
    if (branchId) { query += ' AND branch_id = $2'; values.push(branchId); }
    query += ' ORDER BY opened_at DESC LIMIT 1';
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async list(tenantId, filters = {}) {
    let query = 'SELECT * FROM cash_drawer_sessions WHERE tenant_id = $1';
    const values = [tenantId];
    let p = 2;

    if (filters.status) { query += ` AND status = $${p}`; values.push(filters.status); p++; }
    if (filters.branch_id) { query += ` AND branch_id = $${p}`; values.push(filters.branch_id); p++; }
    if (filters.session_date) { query += ` AND session_date = $${p}`; values.push(filters.session_date); p++; }

    query += ' ORDER BY opened_at DESC';
    if (filters.limit) { query += ` LIMIT $${p}`; values.push(filters.limit); p++; }
    if (filters.offset) { query += ` OFFSET $${p}`; values.push(filters.offset); }

    const result = await pool.query(query, values);
    return result.rows;
  }

  async close(id, tenantId, closedByUserId, closingBalance, notes) {
    // Calculate expected closing: opening + cash payments - refunds
    const expectedResult = await pool.query(
      `SELECT s.opening_balance,
         COALESCE(SUM(CASE WHEN p.payment_method = 'CASH' AND p.payment_status = 'COMPLETED' THEN p.amount ELSE 0 END), 0) AS cash_in
       FROM cash_drawer_sessions s
       LEFT JOIN payments p ON p.drawer_session_id = s.id
       WHERE s.id = $1
       GROUP BY s.opening_balance`,
      [id]
    );

    let expectedClosing = 0;
    if (expectedResult.rows.length > 0) {
      const row = expectedResult.rows[0];
      expectedClosing = parseFloat(row.opening_balance) + parseFloat(row.cash_in);
    }

    const result = await pool.query(
      `UPDATE cash_drawer_sessions
       SET status = 'CLOSED', closed_at = NOW(), closed_by_user_id = $1,
           closing_balance = $2, expected_closing = $3, notes = $4
       WHERE id = $5 AND tenant_id = $6 AND status = 'OPEN'
       RETURNING *`,
      [closedByUserId, closingBalance, expectedClosing, notes || null, id, tenantId]
    );
    return result.rows[0];
  }

  async getSessionSummary(id, tenantId) {
    const result = await pool.query(
      `SELECT
         s.*,
         COUNT(p.id)::int AS payment_count,
         COALESCE(SUM(p.amount) FILTER (WHERE p.payment_status = 'COMPLETED'), 0) AS total_collected,
         COALESCE(SUM(p.amount) FILTER (WHERE p.payment_method = 'CASH' AND p.payment_status = 'COMPLETED'), 0) AS cash_collected,
         COALESCE(SUM(p.amount) FILTER (WHERE p.payment_method = 'CARD' AND p.payment_status = 'COMPLETED'), 0) AS card_collected
       FROM cash_drawer_sessions s
       LEFT JOIN payments p ON p.drawer_session_id = s.id
       WHERE s.id = $1 AND s.tenant_id = $2
       GROUP BY s.id`,
      [id, tenantId]
    );
    return result.rows[0];
  }
}

export default new CashDrawerSessionModel();
