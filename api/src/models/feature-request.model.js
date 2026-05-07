import pool from '../config/database.js';

class FeatureRequestModel {
  async create(data) {
    const query = `
      INSERT INTO feature_requests (company_id, company_name, contact_email, feature_title, message)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [
      data.company_id || null,
      data.company_name || null,
      data.contact_email || null,
      data.feature_title,
      data.message,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async list(filters = {}) {
    let query = 'SELECT * FROM feature_requests WHERE 1=1';
    const values = [];
    let p = 1;

    if (filters.status) {
      query += ` AND status = $${p}`;
      values.push(filters.status);
      p++;
    }

    if (filters.company_id) {
      query += ` AND company_id = $${p}`;
      values.push(filters.company_id);
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

  async updateStatus(id, status) {
    const query = `
      UPDATE feature_requests SET status = $1, updated_at = NOW()
      WHERE id = $2 RETURNING *
    `;
    const result = await pool.query(query, [status, id]);
    return result.rows[0];
  }
}

export default new FeatureRequestModel();
