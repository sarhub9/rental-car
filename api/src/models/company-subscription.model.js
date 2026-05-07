import pool from '../config/database.js';

class CompanySubscriptionModel {
  async findByCompanyId(companyId) {
    const query = `
      SELECT cs.*, sp.name as plan_name, sp.features, sp.max_vehicles, sp.max_users
      FROM company_subscriptions cs
      LEFT JOIN subscription_plans sp ON sp.id = cs.plan_id
      WHERE cs.company_id = $1
    `;
    const result = await pool.query(query, [companyId]);
    return result.rows[0];
  }

  async create(data) {
    const query = `
      INSERT INTO company_subscriptions (
        company_id, plan_id, status, trial_ends_at,
        current_period_start, current_period_end, stripe_subscription_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [
      data.company_id,
      data.plan_id,
      data.status || 'TRIAL',
      data.trial_ends_at || null,
      data.current_period_start || new Date(),
      data.current_period_end,
      data.stripe_subscription_id || null,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async update(companyId, data) {
    const fields = [];
    const values = [];
    let p = 1;

    const allowedFields = [
      'plan_id', 'status', 'trial_ends_at',
      'current_period_start', 'current_period_end', 'cancelled_at',
      'stripe_subscription_id',
    ];

    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${p}`);
        values.push(data[key]);
        p++;
      }
    }

    if (fields.length === 0) throw new Error('No fields to update');

    values.push(companyId);
    const query = `
      UPDATE company_subscriptions SET ${fields.join(', ')}
      WHERE company_id = $${p} RETURNING *
    `;
    const result = await pool.query(query, values);
    return result.rows[0];
  }
}

export default new CompanySubscriptionModel();
