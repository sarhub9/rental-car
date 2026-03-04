import pool from '../config/database.js';

class VehicleCategoryModel {
  async create(data) {
    const query = `
      INSERT INTO vehicle_categories (tenant_id, category_name, category_code, daily_rate_default, weekly_rate_default)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [
      data.tenant_id, data.category_name, data.category_code,
      data.daily_rate_default, data.weekly_rate_default,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async findById(id, tenantId) {
    const query = 'SELECT * FROM vehicle_categories WHERE id = $1 AND tenant_id = $2';
    const result = await pool.query(query, [id, tenantId]);
    return result.rows[0];
  }

  async list(tenantId) {
    const query = 'SELECT * FROM vehicle_categories WHERE tenant_id = $1 ORDER BY category_name';
    const result = await pool.query(query, [tenantId]);
    return result.rows;
  }
}

export default new VehicleCategoryModel();
