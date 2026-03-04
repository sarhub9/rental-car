import pool from '../config/database.js';

class TenantRulesModel {
  async findByTenantId(tenantId) {
    const query = 'SELECT * FROM tenant_rules WHERE tenant_id = $1';
    const result = await pool.query(query, [tenantId]);
    return result.rows[0];
  }

  async create(data) {
    const query = `
      INSERT INTO tenant_rules (
        tenant_id, km_allowance_per_day, rate_per_extra_km,
        fuel_refill_rate, late_fee_per_hour, grace_period_minutes, rule_version
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [
      data.tenant_id, data.km_allowance_per_day || 200,
      data.rate_per_extra_km || 0.5, data.fuel_refill_rate || 100,
      data.late_fee_per_hour || 10, data.grace_period_minutes || 30,
      data.rule_version || 'V1',
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async update(tenantId, data) {
    const fields = [];
    const values = [];
    let p = 1;

    const allowedFields = [
      'km_allowance_per_day', 'rate_per_extra_km', 'fuel_refill_rate',
      'late_fee_per_hour', 'grace_period_minutes', 'rule_version',
    ];

    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${p}`);
        values.push(data[key]);
        p++;
      }
    }

    if (fields.length === 0) throw new Error('No fields to update');

    values.push(tenantId);
    const query = `
      UPDATE tenant_rules SET ${fields.join(', ')}
      WHERE tenant_id = $${p}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }
}

export default new TenantRulesModel();
