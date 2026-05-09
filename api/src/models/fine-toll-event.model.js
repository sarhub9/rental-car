import pool from '../config/database.js';

class FineTollEventModel {
  async create(data) {
    const query = `
      INSERT INTO fine_toll_events (
        tenant_id, event_number, plate_number, plate_emirate, event_type,
        event_datetime, amount, admin_fee, total_amount,
        location, description, source_reference
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *
    `;
    const adminFee = parseFloat(data.admin_fee || 0);
    const amount = parseFloat(data.amount);
    const values = [
      data.tenant_id, data.event_number, data.plate_number, data.plate_emirate || null,
      data.event_type, data.event_datetime, amount, adminFee, amount + adminFee,
      data.location || null, data.description || null, data.source_reference || null,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async findById(id, tenantId) {
    const result = await pool.query(
      `SELECT fte.*,
        ra.agreement_number AS attributed_agreement_number,
        c.full_name_en AS attributed_customer_name
       FROM fine_toll_events fte
       LEFT JOIN rental_agreements ra ON ra.id = fte.attributed_agreement_id
       LEFT JOIN customers c ON c.id = fte.attributed_customer_id
       WHERE fte.id = $1 AND fte.tenant_id = $2`,
      [id, tenantId]
    );
    return result.rows[0];
  }

  async list(tenantId, filters = {}) {
    let query = `
      SELECT fte.*,
        ra.agreement_number AS attributed_agreement_number,
        c.full_name_en AS attributed_customer_name
      FROM fine_toll_events fte
      LEFT JOIN rental_agreements ra ON ra.id = fte.attributed_agreement_id
      LEFT JOIN customers c ON c.id = fte.attributed_customer_id
      WHERE fte.tenant_id = $1
    `;
    const values = [tenantId];
    let p = 2;

    if (filters.attribution_status) { query += ` AND fte.attribution_status = $${p}`; values.push(filters.attribution_status); p++; }
    if (filters.plate_number) { query += ` AND fte.plate_number ILIKE $${p}`; values.push(`%${filters.plate_number}%`); p++; }
    if (filters.event_type) { query += ` AND fte.event_type = $${p}`; values.push(filters.event_type); p++; }

    query += ' ORDER BY fte.event_datetime DESC';
    if (filters.limit) { query += ` LIMIT $${p}`; values.push(filters.limit); p++; }
    if (filters.offset) { query += ` OFFSET $${p}`; values.push(filters.offset); }

    const result = await pool.query(query, values);
    return result.rows;
  }

  async attribute(id, tenantId, agreementId, customerId, method, userId) {
    const result = await pool.query(
      `UPDATE fine_toll_events
       SET attribution_status = 'ATTRIBUTED', attributed_agreement_id = $1,
           attributed_customer_id = $2, attribution_method = $3,
           attributed_at = NOW(), attributed_by_user_id = $4
       WHERE id = $5 AND tenant_id = $6
       RETURNING *`,
      [agreementId, customerId, method, userId, id, tenantId]
    );
    return result.rows[0];
  }

  async setConflict(id, tenantId, conflictNotes) {
    const result = await pool.query(
      `UPDATE fine_toll_events SET attribution_status = 'CONFLICT', conflict_notes = $1
       WHERE id = $2 AND tenant_id = $3 RETURNING *`,
      [conflictNotes, id, tenantId]
    );
    return result.rows[0];
  }

  async setWaived(id, tenantId) {
    const result = await pool.query(
      `UPDATE fine_toll_events SET attribution_status = 'WAIVED'
       WHERE id = $1 AND tenant_id = $2 RETURNING *`,
      [id, tenantId]
    );
    return result.rows[0];
  }

  // Find agreements that overlap with event_datetime for a plate
  async findMatchingAgreements(tenantId, plateNumber, eventDatetime) {
    const result = await pool.query(
      `SELECT ra.id, ra.agreement_number, ra.customer_id, ra.rental_start_datetime, ra.rental_end_datetime
       FROM rental_agreements ra
       JOIN vehicles v ON v.id = ra.vehicle_id
       WHERE ra.tenant_id = $1
         AND v.plate_number = $2
         AND ra.rental_start_datetime <= $3
         AND ra.rental_end_datetime >= $3
         AND ra.status IN ('ACTIVE','CLOSED')
       ORDER BY ra.rental_start_datetime ASC`,
      [tenantId, plateNumber, eventDatetime]
    );
    return result.rows;
  }

  async generateEventNumber(tenantId) {
    const year = new Date().getFullYear();
    const result = await pool.query(
      `SELECT event_number FROM fine_toll_events WHERE tenant_id = $1 AND event_number LIKE $2 ORDER BY event_number DESC LIMIT 1`,
      [tenantId, `EVT-${year}-%`]
    );
    if (result.rows.length === 0) return `EVT-${year}-00001`;
    const seq = parseInt(result.rows[0].event_number.split('-')[2]) + 1;
    return `EVT-${year}-${seq.toString().padStart(5, '0')}`;
  }
}

export default new FineTollEventModel();
