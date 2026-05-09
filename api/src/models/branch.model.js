import pool from '../config/database.js';

class BranchModel {
  async create(data) {
    const query = `
      INSERT INTO branches (tenant_id, branch_name, branch_code, address, phone, email, is_main_branch)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [
      data.tenant_id, data.branch_name, data.branch_code,
      data.address || null, data.phone || null, data.email || null,
      data.is_main_branch || false,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async findById(id, tenantId) {
    const result = await pool.query(
      'SELECT * FROM branches WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    return result.rows[0];
  }

  async list(tenantId, filters = {}) {
    let query = 'SELECT * FROM branches WHERE tenant_id = $1';
    const values = [tenantId];
    let p = 2;

    if (filters.is_active !== undefined) {
      query += ` AND is_active = $${p}`;
      values.push(filters.is_active);
      p++;
    }

    query += ' ORDER BY is_main_branch DESC, branch_name ASC';
    const result = await pool.query(query, values);
    return result.rows;
  }

  async update(id, tenantId, data) {
    const fields = [];
    const values = [];
    let p = 1;

    const allowed = ['branch_name', 'branch_code', 'address', 'phone', 'email', 'is_active', 'is_main_branch'];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${p}`);
        values.push(data[key]);
        p++;
      }
    }

    if (fields.length === 0) throw new Error('No fields to update');

    values.push(id, tenantId);
    const query = `UPDATE branches SET ${fields.join(', ')} WHERE id = $${p} AND tenant_id = $${p + 1} RETURNING *`;
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async findByCode(code, tenantId) {
    const result = await pool.query(
      'SELECT * FROM branches WHERE branch_code = $1 AND tenant_id = $2',
      [code, tenantId]
    );
    return result.rows[0];
  }
}

export default new BranchModel();
