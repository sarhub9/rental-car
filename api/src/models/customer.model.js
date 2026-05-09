import pool from '../config/database.js';

class CustomerModel {
  async create(data) {
    const query = `
      INSERT INTO customers (
        tenant_id, customer_number, full_name_en, full_name_ar,
        phone_number, whatsapp_number, email, nationality, date_of_birth,
        emirates_id, id_expiry_date, driving_license_number, license_expiry_date,
        passport_number, passport_expiry, visa_number, visa_expiry,
        hotel_name, hotel_address, arrival_date, departure_date,
        company_name, trade_license_number, trade_license_expiry, trn_number,
        authorized_person_name, authorized_person_mobile, payment_terms, credit_limit,
        customer_type, address_line_1, address_line_2, city, emirate,
        created_by_user_id
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
        $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35
      ) RETURNING *
    `;
    const values = [
      data.tenant_id, data.customer_number, data.full_name_en, data.full_name_ar || null,
      data.phone_number, data.whatsapp_number || null, data.email || null,
      data.nationality || null, data.date_of_birth || null,
      data.emirates_id || null, data.id_expiry_date || null,
      data.driving_license_number || null, data.license_expiry_date || null,
      data.passport_number || null, data.passport_expiry || null,
      data.visa_number || null, data.visa_expiry || null,
      data.hotel_name || null, data.hotel_address || null,
      data.arrival_date || null, data.departure_date || null,
      data.company_name || null, data.trade_license_number || null,
      data.trade_license_expiry || null, data.trn_number || null,
      data.authorized_person_name || null, data.authorized_person_mobile || null,
      data.payment_terms || 'CASH', data.credit_limit || 0,
      data.customer_type || 'UAE_RESIDENT',
      data.address_line_1 || null, data.address_line_2 || null,
      data.city || null, data.emirate || null,
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
      'full_name_en', 'full_name_ar', 'phone_number', 'whatsapp_number', 'email',
      'nationality', 'date_of_birth',
      'emirates_id', 'id_expiry_date', 'driving_license_number', 'license_expiry_date',
      'passport_number', 'passport_expiry', 'visa_number', 'visa_expiry',
      'hotel_name', 'hotel_address', 'arrival_date', 'departure_date',
      'company_name', 'trade_license_number', 'trade_license_expiry', 'trn_number',
      'authorized_person_name', 'authorized_person_mobile', 'payment_terms', 'credit_limit',
      'customer_type', 'address_line_1', 'address_line_2', 'city',
      'emirate', 'is_active', 'is_blacklisted', 'blacklist_reason', 'verification_status',
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
