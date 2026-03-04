import pool from '../config/database.js';

class CustomerModel {
  async create(data) {
    const query = `
      INSERT INTO customers (
        tenant_id, customer_number, full_name_en, full_name_ar,
        phone_number, email, emirates_id, driving_license_number,
        license_expiry_date, customer_type, address_line_1, address_line_2,
        city, emirate, created_by_user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;
    const values = [
      data.tenant_id, data.customer_number, data.full_name_en, data.full_name_ar,
      data.phone_number, data.email, data.emirates_id, data.driving_license_number,
      data.license_expiry_date, data.customer_type || 'INDIVIDUAL',
      data.address_line_1, data.address_line_2, data.city, data.emirate,
      data.created_by_user_id,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async findById(id, tenantId) {
    const query = 'SELECT * FROM customers WHERE id = $1 AND tenant_id = $2';
    const result = await pool.query(query, [id, tenantId]);
    return result.rows[0];
  }

  async list(tenantId, filters = {}) {
    let query = 'SELECT * FROM customers WHERE tenant_id = $1';
    const values = [tenantId];
    let p = 2;

    if (filters.is_active !== undefined) {
      query += ` AND is_active = $${p}`;
      values.push(filters.is_active);
      p++;
    }

    if (filters.customer_type) {
      query += ` AND customer_type = $${p}`;
      values.push(filters.customer_type);
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

  async update(id, tenantId, data) {
    const fields = [];
    const values = [];
    let p = 1;

    const allowedFields = [
      'full_name_en', 'full_name_ar', 'phone_number', 'email',
      'emirates_id', 'driving_license_number', 'license_expiry_date',
      'customer_type', 'address_line_1', 'address_line_2', 'city',
      'emirate', 'is_active', 'is_blacklisted',
    ];

    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${p}`);
        values.push(data[key]);
        p++;
      }
    }

    if (fields.length === 0) throw new Error('No fields to update');

    values.push(id, tenantId);
    const query = `
      UPDATE customers SET ${fields.join(', ')}
      WHERE id = $${p} AND tenant_id = $${p + 1}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async search(tenantId, searchTerm) {
    const query = `
      SELECT * FROM customers
      WHERE tenant_id = $1
        AND is_active = TRUE
        AND (
          full_name_en ILIKE $2
          OR full_name_ar ILIKE $2
          OR phone_number ILIKE $2
          OR email ILIKE $2
          OR driving_license_number ILIKE $2
          OR emirates_id ILIKE $2
        )
      ORDER BY full_name_en ASC
      LIMIT 20
    `;
    const result = await pool.query(query, [tenantId, `%${searchTerm}%`]);
    return result.rows;
  }

  async generateCustomerNumber(tenantId) {
    const query = `
      SELECT customer_number FROM customers
      WHERE tenant_id = $1
      ORDER BY customer_number DESC
      LIMIT 1
    `;
    const result = await pool.query(query, [tenantId]);

    if (result.rows.length === 0) return 'CUS-00001';

    const last = result.rows[0].customer_number;
    const seq = parseInt(last.split('-')[1]) + 1;
    return `CUS-${seq.toString().padStart(5, '0')}`;
  }
}

export default new CustomerModel();
