import pool from '../config/database.js';

class RatePlanModel {
  async create(data) {
    const query = `
      INSERT INTO rate_plans (
        tenant_id, name, version, daily_rate, weekly_rate, monthly_rate,
        included_km_per_day, extra_km_rate, fuel_policy, late_return_rules,
        deposit_amount, add_ons, terms_text, is_active, effective_from, effective_to
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      RETURNING *
    `;
    const values = [
      data.tenant_id, data.name, data.version || 1,
      data.daily_rate, data.weekly_rate, data.monthly_rate,
      data.included_km_per_day || 200, data.extra_km_rate || 0.5,
      data.fuel_policy ? JSON.stringify(data.fuel_policy) : '{"refill_rate":100,"unit":"AED"}',
      data.late_return_rules ? JSON.stringify(data.late_return_rules) : '{"grace_period_minutes":30,"hourly_rate":10,"daily_cap":150}',
      data.deposit_amount || 0,
      data.add_ons ? JSON.stringify(data.add_ons) : '[]',
      data.terms_text || null,
      data.is_active !== undefined ? data.is_active : true,
      data.effective_from || null, data.effective_to || null,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async findById(id, tenantId) {
    const query = 'SELECT * FROM rate_plans WHERE id = $1 AND tenant_id = $2';
    const result = await pool.query(query, [id, tenantId]);
    return result.rows[0];
  }

  async findActiveByTenantId(tenantId) {
    const query = `
      SELECT * FROM rate_plans
      WHERE tenant_id = $1 AND is_active = TRUE
      ORDER BY name, version DESC
    `;
    const result = await pool.query(query, [tenantId]);
    return result.rows;
  }

  async findByName(name, tenantId) {
    const query = `
      SELECT * FROM rate_plans
      WHERE tenant_id = $1 AND name = $2
      ORDER BY version DESC LIMIT 1
    `;
    const result = await pool.query(query, [tenantId, name]);
    return result.rows[0];
  }

  async createNewVersion(id, tenantId, data) {
    const existing = await this.findById(id, tenantId);
    if (!existing) throw new Error('Rate plan not found');

    await pool.query(
      'UPDATE rate_plans SET is_active = FALSE WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    return this.create({
      ...existing, ...data,
      tenant_id: tenantId,
      name: existing.name,
      version: existing.version + 1,
      is_active: true,
    });
  }

  async update(id, tenantId, data) {
    const fields = [];
    const values = [];
    let p = 1;
    const allowed = [
      'daily_rate', 'weekly_rate', 'monthly_rate', 'included_km_per_day',
      'extra_km_rate', 'deposit_amount', 'terms_text', 'is_active',
      'effective_from', 'effective_to',
    ];
    const jsonFields = ['fuel_policy', 'late_return_rules', 'add_ons'];

    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${p}`);
        values.push(data[key]);
        p++;
      }
    }
    for (const key of jsonFields) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${p}`);
        values.push(JSON.stringify(data[key]));
        p++;
      }
    }

    if (fields.length === 0) throw new Error('No fields to update');
    values.push(id, tenantId);

    const query = `
      UPDATE rate_plans SET ${fields.join(', ')}
      WHERE id = $${p} AND tenant_id = $${p + 1}
      RETURNING *
    `;
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async list(tenantId, filters = {}) {
    let query = 'SELECT * FROM rate_plans WHERE tenant_id = $1';
    const values = [tenantId];
    let p = 2;

    if (filters.is_active !== undefined) {
      query += ` AND is_active = $${p}`;
      values.push(filters.is_active);
      p++;
    }
    query += ' ORDER BY name, version DESC';

    if (filters.limit) { query += ` LIMIT $${p}`; values.push(filters.limit); p++; }
    if (filters.offset) { query += ` OFFSET $${p}`; values.push(filters.offset); }

    const result = await pool.query(query, values);
    return result.rows;
  }
}

export default new RatePlanModel();
