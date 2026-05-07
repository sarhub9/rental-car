import pool from '../config/database.js';

class SubscriptionPlanModel {
  async list(activeOnly = true) {
    let query = 'SELECT * FROM subscription_plans';
    const values = [];
    if (activeOnly) {
      query += ' WHERE is_active = TRUE';
    }
    query += ' ORDER BY sort_order ASC, price_monthly ASC';
    const result = await pool.query(query, values);
    return result.rows;
  }

  async findById(id) {
    const query = 'SELECT * FROM subscription_plans WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  async create(data) {
    const query = `
      INSERT INTO subscription_plans (
        name, description, price_monthly, price_annual, features,
        max_vehicles, max_users, max_agreements_per_month, is_active, sort_order
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    const values = [
      data.name,
      data.description || null,
      data.price_monthly,
      data.price_annual || null,
      data.features || '{}',
      data.max_vehicles || null,
      data.max_users || null,
      data.max_agreements_per_month || null,
      data.is_active !== undefined ? data.is_active : true,
      data.sort_order || 0,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async update(id, data) {
    const fields = [];
    const values = [];
    let p = 1;

    const allowedFields = [
      'name', 'description', 'price_monthly', 'price_annual', 'features',
      'max_vehicles', 'max_users', 'max_agreements_per_month', 'is_active', 'sort_order',
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
      UPDATE subscription_plans SET ${fields.join(', ')}
      WHERE id = $${p} RETURNING *
    `;
    const result = await pool.query(query, values);
    return result.rows[0];
  }
}

export default new SubscriptionPlanModel();
