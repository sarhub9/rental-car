import pool from '../config/database.js';

class IncidentModel {
  async create(data) {
    const query = `
      INSERT INTO incidents (
        tenant_id, incident_number, agreement_id, vehicle_id, customer_id,
        incident_type, incident_datetime, location, description,
        police_report_number, created_by_user_id, assigned_to_user_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *
    `;
    const values = [
      data.tenant_id, data.incident_number, data.agreement_id,
      data.vehicle_id, data.customer_id, data.incident_type,
      data.incident_datetime, data.location || null, data.description,
      data.police_report_number || null, data.created_by_user_id,
      data.assigned_to_user_id || null,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async findById(id, tenantId) {
    const query = `
      SELECT i.*,
        v.plate_number, v.make, v.model,
        c.full_name_en AS customer_name,
        ra.agreement_number
      FROM incidents i
      LEFT JOIN vehicles v ON v.id = i.vehicle_id
      LEFT JOIN customers c ON c.id = i.customer_id
      LEFT JOIN rental_agreements ra ON ra.id = i.agreement_id
      WHERE i.id = $1 AND i.tenant_id = $2
    `;
    const result = await pool.query(query, [id, tenantId]);
    return result.rows[0];
  }

  async list(tenantId, filters = {}) {
    let query = `
      SELECT i.*,
        v.plate_number, v.make, v.model,
        c.full_name_en AS customer_name
      FROM incidents i
      LEFT JOIN vehicles v ON v.id = i.vehicle_id
      LEFT JOIN customers c ON c.id = i.customer_id
      WHERE i.tenant_id = $1
    `;
    const values = [tenantId];
    let p = 2;

    if (filters.status) { query += ` AND i.status = $${p}`; values.push(filters.status); p++; }
    if (filters.vehicle_id) { query += ` AND i.vehicle_id = $${p}`; values.push(filters.vehicle_id); p++; }
    if (filters.incident_type) { query += ` AND i.incident_type = $${p}`; values.push(filters.incident_type); p++; }

    query += ' ORDER BY i.incident_datetime DESC';
    if (filters.limit) { query += ` LIMIT $${p}`; values.push(filters.limit); p++; }
    if (filters.offset) { query += ` OFFSET $${p}`; values.push(filters.offset); }

    const result = await pool.query(query, values);
    return result.rows;
  }

  async update(id, tenantId, data) {
    const fields = [];
    const values = [];
    let p = 1;

    const allowed = [
      'status', 'police_report_number', 'estimated_repair_cost', 'actual_repair_cost',
      'insurance_claim_number', 'claim_amount', 'settlement_amount', 'settled_at',
      'assigned_to_user_id', 'resolution_notes',
    ];

    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${p}`);
        values.push(data[key]);
        p++;
      }
    }

    if (fields.length === 0) throw new Error('No fields to update');

    values.push(id, tenantId);
    const query = `UPDATE incidents SET ${fields.join(', ')} WHERE id = $${p} AND tenant_id = $${p + 1} RETURNING *`;
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async addPhoto(data) {
    const result = await pool.query(
      `INSERT INTO incident_photos
       (tenant_id, incident_id, photo_url, thumbnail_url, description, gps_latitude, gps_longitude, uploaded_by_user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        data.tenant_id, data.incident_id, data.photo_url,
        data.thumbnail_url || null, data.description || null,
        data.gps_latitude || null, data.gps_longitude || null,
        data.uploaded_by_user_id,
      ]
    );
    return result.rows[0];
  }

  async getPhotos(incidentId, tenantId) {
    const result = await pool.query(
      'SELECT * FROM incident_photos WHERE incident_id = $1 AND tenant_id = $2 ORDER BY created_at ASC',
      [incidentId, tenantId]
    );
    return result.rows;
  }

  async generateIncidentNumber(tenantId) {
    const year = new Date().getFullYear();
    const result = await pool.query(
      `SELECT incident_number FROM incidents WHERE tenant_id = $1 AND incident_number LIKE $2 ORDER BY incident_number DESC LIMIT 1`,
      [tenantId, `INC-${year}-%`]
    );
    if (result.rows.length === 0) return `INC-${year}-00001`;
    const seq = parseInt(result.rows[0].incident_number.split('-')[2]) + 1;
    return `INC-${year}-${seq.toString().padStart(5, '0')}`;
  }
}

export default new IncidentModel();
