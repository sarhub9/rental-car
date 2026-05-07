import pool from '../config/database.js';

class CompanyModel {
  async create(data) {
    const query = `
      INSERT INTO companies (
        name, contact_email, phone_number, address, logo_url, trade_license_number
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [
      data.name,
      data.contact_email,
      data.phone_number || null,
      data.address || null,
      data.logo_url || null,
      data.trade_license_number || null,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async findById(id) {
    const query = 'SELECT * FROM companies WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  async findByEmail(email) {
    const query = 'SELECT * FROM companies WHERE contact_email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  async update(id, data) {
    const fields = [];
    const values = [];
    let p = 1;

    const allowedFields = [
      'name', 'contact_email', 'phone_number', 'address', 'logo_url', 'trade_license_number',
    ];

    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${p}`);
        values.push(data[key]);
        p++;
      }
    }

    if (fields.length === 0) throw new Error('No fields to update');

    values.push(id);
    const query = `
      UPDATE companies SET ${fields.join(', ')}
      WHERE id = $${p} RETURNING *
    `;
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async updateStatus(id, status) {
    const query = `
      UPDATE companies SET status = $1, updated_at = NOW()
      WHERE id = $2 RETURNING *
    `;
    const result = await pool.query(query, [status, id]);
    return result.rows[0];
  }

  async list(filters = {}) {
    let query = 'SELECT * FROM companies WHERE 1=1';
    const values = [];
    let p = 1;

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
    if (filters.offset !== undefined && filters.offset !== null) {
      query += ` OFFSET $${p}`;
      values.push(filters.offset);
    }

    const result = await pool.query(query, values);
    return result.rows;
  }

  async count(filters = {}) {
    let query = 'SELECT COUNT(*) as count FROM companies WHERE 1=1';
    const values = [];
    let p = 1;

    if (filters.status) {
      query += ` AND status = $${p}`;
      values.push(filters.status);
      p++;
    }

    const result = await pool.query(query, values);
    return parseInt(result.rows[0].count);
  }
}

export default new CompanyModel();
