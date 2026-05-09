import pool from '../config/database.js';

class DriverProfileModel {
  async create(data) {
    const query = `
      INSERT INTO driver_profiles (
        tenant_id, driver_number, driver_type, full_name, phone_number,
        whatsapp_number, email, nationality, date_of_birth, address,
        emirates_id, emirates_id_expiry, passport_number, passport_expiry,
        visa_number, visa_expiry, driving_license_number, license_expiry_date,
        license_country, idp_required, idp_number, idp_expiry,
        customer_id, company_id, corporate_account_id, user_id,
        created_by_user_id
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,
        $19,$20,$21,$22,$23,$24,$25,$26,$27
      ) RETURNING *
    `;
    const values = [
      data.tenant_id, data.driver_number, data.driver_type, data.full_name, data.phone_number,
      data.whatsapp_number || null, data.email || null, data.nationality || null,
      data.date_of_birth || null, data.address || null,
      data.emirates_id || null, data.emirates_id_expiry || null,
      data.passport_number || null, data.passport_expiry || null,
      data.visa_number || null, data.visa_expiry || null,
      data.driving_license_number, data.license_expiry_date,
      data.license_country || 'UAE',
      data.idp_required || false, data.idp_number || null, data.idp_expiry || null,
      data.customer_id || null, data.company_id || null,
      data.corporate_account_id || null, data.user_id || null,
      data.created_by_user_id,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async findById(id, tenantId) {
    const query = `
      SELECT dp.*, c.full_name_en AS customer_name
      FROM driver_profiles dp
      LEFT JOIN customers c ON c.id = dp.customer_id
      WHERE dp.id = $1 AND dp.tenant_id = $2
    `;
    const result = await pool.query(query, [id, tenantId]);
    return result.rows[0];
  }

  async list(tenantId, filters = {}) {
    let query = `
      SELECT dp.*, c.full_name_en AS customer_name
      FROM driver_profiles dp
      LEFT JOIN customers c ON c.id = dp.customer_id
      WHERE dp.tenant_id = $1
    `;
    const values = [tenantId];
    let p = 2;

    if (filters.driver_type) {
      query += ` AND dp.driver_type = $${p}`;
      values.push(filters.driver_type);
      p++;
    }
    if (filters.is_active !== undefined) {
      query += ` AND dp.is_active = $${p}`;
      values.push(filters.is_active);
      p++;
    }
    if (filters.customer_id) {
      query += ` AND dp.customer_id = $${p}`;
      values.push(filters.customer_id);
      p++;
    }

    query += ' ORDER BY dp.created_at DESC';

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
    const allowed = [
      'driver_type', 'full_name', 'phone_number', 'whatsapp_number', 'email',
      'nationality', 'date_of_birth', 'address',
      'emirates_id', 'emirates_id_expiry', 'passport_number', 'passport_expiry',
      'visa_number', 'visa_expiry', 'driving_license_number', 'license_expiry_date',
      'license_country', 'idp_required', 'idp_number', 'idp_expiry',
      'customer_id', 'company_id', 'corporate_account_id',
      'is_active', 'is_blacklisted', 'blacklist_reason',
    ];

    const fields = [];
    const values = [];
    let p = 1;

    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${p}`);
        values.push(data[key]);
        p++;
      }
    }

    if (!fields.length) throw new Error('No fields to update');

    values.push(id, tenantId);
    const query = `
      UPDATE driver_profiles SET ${fields.join(', ')}
      WHERE id = $${p} AND tenant_id = $${p + 1}
      RETURNING *
    `;
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async search(tenantId, term) {
    const query = `
      SELECT dp.*, c.full_name_en AS customer_name
      FROM driver_profiles dp
      LEFT JOIN customers c ON c.id = dp.customer_id
      WHERE dp.tenant_id = $1 AND dp.is_active = TRUE
        AND (
          dp.full_name ILIKE $2 OR dp.phone_number ILIKE $2
          OR dp.email ILIKE $2 OR dp.driving_license_number ILIKE $2
          OR dp.emirates_id ILIKE $2
        )
      ORDER BY dp.full_name ASC LIMIT 20
    `;
    const result = await pool.query(query, [tenantId, `%${term}%`]);
    return result.rows;
  }

  async generateDriverNumber(tenantId) {
    const query = `
      SELECT driver_number FROM driver_profiles
      WHERE tenant_id = $1 ORDER BY driver_number DESC LIMIT 1
    `;
    const result = await pool.query(query, [tenantId]);
    if (!result.rows.length) return 'DRV-00001';
    const seq = parseInt(result.rows[0].driver_number.split('-')[1]) + 1;
    return `DRV-${seq.toString().padStart(5, '0')}`;
  }

  async count(tenantId) {
    const result = await pool.query(
      'SELECT COUNT(*) FROM driver_profiles WHERE tenant_id = $1',
      [tenantId]
    );
    return parseInt(result.rows[0].count);
  }
}

export default new DriverProfileModel();
