import pool from '../config/database.js';

class SystemAuditLogModel {
  async create(data) {
    const query = `
      INSERT INTO system_audit_log (
        tenant_id, user_id, action, entity_type, entity_id,
        old_value, new_value, justification, ip_address, user_agent
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
    `;
    const values = [
      data.tenant_id, data.user_id, data.action, data.entity_type,
      data.entity_id || null,
      data.old_value ? JSON.stringify(data.old_value) : null,
      data.new_value ? JSON.stringify(data.new_value) : null,
      data.justification || null,
      data.ip_address || null, data.user_agent || null,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async list(tenantId, filters = {}) {
    let query = `
      SELECT sal.*, u.full_name as user_name
      FROM system_audit_log sal
      LEFT JOIN users u ON u.id = sal.user_id
      WHERE sal.tenant_id = $1
    `;
    const values = [tenantId];
    let p = 2;

    if (filters.date_from) { query += ` AND sal.created_at >= $${p}`; values.push(filters.date_from); p++; }
    if (filters.date_to) { query += ` AND sal.created_at <= $${p}`; values.push(filters.date_to); p++; }
    if (filters.user_id) { query += ` AND sal.user_id = $${p}`; values.push(filters.user_id); p++; }
    if (filters.action) { query += ` AND sal.action = $${p}`; values.push(filters.action); p++; }
    if (filters.entity_type) { query += ` AND sal.entity_type = $${p}`; values.push(filters.entity_type); p++; }
    if (filters.entity_id) { query += ` AND sal.entity_id = $${p}`; values.push(filters.entity_id); p++; }

    query += ' ORDER BY sal.created_at DESC';
    if (filters.limit) { query += ` LIMIT $${p}`; values.push(filters.limit); p++; }
    if (filters.offset) { query += ` OFFSET $${p}`; values.push(filters.offset); }

    const result = await pool.query(query, values);
    return result.rows;
  }

  async count(tenantId, filters = {}) {
    let query = 'SELECT COUNT(*) as total FROM system_audit_log WHERE tenant_id = $1';
    const values = [tenantId];
    let p = 2;
    if (filters.action) { query += ` AND action = $${p}`; values.push(filters.action); p++; }
    if (filters.entity_type) { query += ` AND entity_type = $${p}`; values.push(filters.entity_type); p++; }
    const result = await pool.query(query, values);
    return parseInt(result.rows[0].total);
  }
}

export default new SystemAuditLogModel();
