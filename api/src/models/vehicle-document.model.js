import pool from '../config/database.js';

class VehicleDocumentModel {
  async create(data) {
    const query = `
      INSERT INTO vehicle_documents (
        tenant_id, vehicle_id, document_type, document_number,
        issued_date, expiry_date, document_url, thumbnail_url, notes, uploaded_by_user_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
    `;
    const values = [
      data.tenant_id, data.vehicle_id, data.document_type,
      data.document_number || null, data.issued_date || null, data.expiry_date || null,
      data.document_url || null, data.thumbnail_url || null,
      data.notes || null, data.uploaded_by_user_id,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async findById(id, tenantId) {
    const result = await pool.query(
      'SELECT * FROM vehicle_documents WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    return result.rows[0];
  }

  async findByVehicle(vehicleId, tenantId, activeOnly = true) {
    let query = 'SELECT * FROM vehicle_documents WHERE vehicle_id = $1 AND tenant_id = $2';
    const values = [vehicleId, tenantId];
    if (activeOnly) { query += ' AND is_active = TRUE'; }
    query += ' ORDER BY document_type ASC, expiry_date DESC';
    const result = await pool.query(query, values);
    return result.rows;
  }

  async getExpiringSoon(tenantId, withinDays = 30) {
    const result = await pool.query(
      `SELECT vd.*, v.plate_number, v.make, v.model
       FROM vehicle_documents vd
       JOIN vehicles v ON v.id = vd.vehicle_id
       WHERE vd.tenant_id = $1 AND vd.is_active = TRUE
         AND vd.expiry_date IS NOT NULL
         AND vd.expiry_date <= CURRENT_DATE + $2
         AND vd.expiry_date >= CURRENT_DATE
       ORDER BY vd.expiry_date ASC`,
      [tenantId, withinDays]
    );
    return result.rows;
  }

  async getExpired(tenantId) {
    const result = await pool.query(
      `SELECT vd.*, v.plate_number, v.make, v.model
       FROM vehicle_documents vd
       JOIN vehicles v ON v.id = vd.vehicle_id
       WHERE vd.tenant_id = $1 AND vd.is_active = TRUE
         AND vd.expiry_date IS NOT NULL AND vd.expiry_date < CURRENT_DATE
       ORDER BY vd.expiry_date ASC`,
      [tenantId]
    );
    return result.rows;
  }

  async update(id, tenantId, data) {
    const fields = [];
    const values = [];
    let p = 1;

    const allowed = ['document_number', 'issued_date', 'expiry_date', 'document_url', 'thumbnail_url', 'notes', 'is_active'];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${p}`);
        values.push(data[key]);
        p++;
      }
    }

    if (fields.length === 0) throw new Error('No fields to update');

    values.push(id, tenantId);
    const query = `UPDATE vehicle_documents SET ${fields.join(', ')} WHERE id = $${p} AND tenant_id = $${p + 1} RETURNING *`;
    const result = await pool.query(query, values);
    return result.rows[0];
  }
}

export default new VehicleDocumentModel();
