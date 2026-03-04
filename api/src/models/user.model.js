import pool from '../config/database.js';

class UserModel {
  async create(data) {
    const query = `
      INSERT INTO users (
        tenant_id, phone_number, email, password_hash, role, status,
        customer_id, full_name, profile_photo_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const values = [
      data.tenant_id,
      data.phone_number,
      data.email || null,
      data.password_hash || null,
      data.role,
      data.status || 'ACTIVE',
      data.customer_id || null,
      data.full_name,
      data.profile_photo_url || null,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async findById(id, tenantId) {
    const query = 'SELECT * FROM users WHERE id = $1 AND tenant_id = $2';
    const result = await pool.query(query, [id, tenantId]);
    return result.rows[0];
  }

  async findByPhone(phoneNumber, tenantId) {
    const query = 'SELECT * FROM users WHERE phone_number = $1 AND tenant_id = $2';
    const result = await pool.query(query, [phoneNumber, tenantId]);
    return result.rows[0];
  }

  async findByCustomerId(customerId) {
    const query = 'SELECT * FROM users WHERE customer_id = $1';
    const result = await pool.query(query, [customerId]);
    return result.rows[0];
  }

  async updateLastLogin(userId) {
    const query = `
      UPDATE users
      SET last_login_at = NOW(), failed_login_attempts = 0
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  async updateProfile(userId, tenantId, data) {
    const fields = [];
    const values = [];
    let p = 1;

    const allowedFields = ['full_name', 'email', 'profile_photo_url'];

    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${p}`);
        values.push(data[key]);
        p++;
      }
    }

    if (fields.length === 0) throw new Error('No fields to update');

    values.push(userId, tenantId);
    const query = `
      UPDATE users SET ${fields.join(', ')}
      WHERE id = $${p} AND tenant_id = $${p + 1}
      RETURNING *
    `;
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async incrementFailedAttempts(userId) {
    const query = `
      UPDATE users
      SET failed_login_attempts = failed_login_attempts + 1
      WHERE id = $1
      RETURNING failed_login_attempts
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0]?.failed_login_attempts;
  }

  async lockUser(userId, lockUntil) {
    const query = `
      UPDATE users SET status = 'LOCKED', locked_until = $2
      WHERE id = $1
    `;
    await pool.query(query, [userId, lockUntil]);
  }

  async findByEmail(email, tenantId) {
    const query = 'SELECT * FROM users WHERE email = $1 AND tenant_id = $2';
    const result = await pool.query(query, [email, tenantId]);
    return result.rows[0];
  }

  async updateRole(userId, tenantId, role) {
    const query = `
      UPDATE users SET role = $1
      WHERE id = $2 AND tenant_id = $3
      RETURNING *
    `;
    const result = await pool.query(query, [role, userId, tenantId]);
    return result.rows[0];
  }

  async updateStatus(userId, tenantId, status) {
    const query = `
      UPDATE users SET status = $1
      WHERE id = $2 AND tenant_id = $3
      RETURNING *
    `;
    const result = await pool.query(query, [status, userId, tenantId]);
    return result.rows[0];
  }

  async countByRoleAndStatus(tenantId, role, status) {
    const query = 'SELECT COUNT(*)::int FROM users WHERE tenant_id = $1 AND role = $2 AND status = $3';
    const result = await pool.query(query, [tenantId, role, status]);
    return result.rows[0].count;
  }

  async list(tenantId, filters = {}) {
    let query = 'SELECT * FROM users WHERE tenant_id = $1';
    const values = [tenantId];
    let p = 2;

    if (filters.role) {
      query += ` AND role = $${p}`;
      values.push(filters.role);
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
}

export default new UserModel();
