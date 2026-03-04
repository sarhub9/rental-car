import pool from '../config/database.js';

class TollFineEventModel {
  async create(data) {
    const query = `
      INSERT INTO toll_fine_events (
        tenant_id, plate_number, event_type, event_timestamp, amount,
        location, source_reference, attribution_status, import_batch_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *
    `;
    const values = [
      data.tenant_id, data.plate_number, data.event_type, data.event_timestamp,
      data.amount, data.location, data.source_reference,
      data.attribution_status || 'pending', data.import_batch_id,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async bulkCreate(events) {
    const results = [];
    for (const event of events) {
      results.push(await this.create(event));
    }
    return results;
  }

  async findById(id, tenantId) {
    const query = 'SELECT * FROM toll_fine_events WHERE id = $1 AND tenant_id = $2';
    const result = await pool.query(query, [id, tenantId]);
    return result.rows[0];
  }

  async findUnmatched(tenantId, filters = {}) {
    let query = `
      SELECT * FROM toll_fine_events
      WHERE tenant_id = $1 AND attribution_status IN ('pending', 'unmatched')
    `;
    const values = [tenantId];
    let p = 2;
    if (filters.plate_number) { query += ` AND plate_number = $${p}`; values.push(filters.plate_number); p++; }
    query += ' ORDER BY event_timestamp DESC';
    if (filters.limit) { query += ` LIMIT $${p}`; values.push(filters.limit); p++; }
    if (filters.offset) { query += ` OFFSET $${p}`; values.push(filters.offset); }
    const result = await pool.query(query, values);
    return result.rows;
  }

  async findByAgreementId(agreementId, tenantId) {
    const query = 'SELECT * FROM toll_fine_events WHERE agreement_id = $1 AND tenant_id = $2 ORDER BY event_timestamp';
    const result = await pool.query(query, [agreementId, tenantId]);
    return result.rows;
  }

  async updateAttribution(id, tenantId, agreementId, chargeId, status, matchedByUserId = null) {
    const query = `
      UPDATE toll_fine_events
      SET attribution_status = $1, agreement_id = $2, charge_id = $3,
          matched_at = NOW(), matched_by_user_id = $4
      WHERE id = $5 AND tenant_id = $6
      RETURNING *
    `;
    const result = await pool.query(query, [status, agreementId, chargeId, matchedByUserId, id, tenantId]);
    return result.rows[0];
  }

  async findMatchingAgreement(plateNumber, eventTimestamp, tenantId) {
    const query = `
      SELECT ra.id as agreement_id, ra.agreement_number
      FROM rental_agreements ra
      JOIN vehicles v ON v.id = ra.vehicle_id
      WHERE v.plate_number = $1
        AND ra.tenant_id = $2
        AND ra.status IN ('ACTIVE', 'CLOSED')
        AND ra.checkout_timestamp <= $3
        AND (ra.return_timestamp IS NULL OR ra.return_timestamp >= $3)
      ORDER BY ra.checkout_timestamp DESC
      LIMIT 1
    `;
    const result = await pool.query(query, [plateNumber, tenantId, eventTimestamp]);
    return result.rows[0];
  }

  async list(tenantId, filters = {}) {
    let query = `
      SELECT tfe.*, ra.agreement_number
      FROM toll_fine_events tfe
      LEFT JOIN rental_agreements ra ON ra.id = tfe.agreement_id
      WHERE tfe.tenant_id = $1
    `;
    const values = [tenantId];
    let p = 2;
    if (filters.attribution_status) { query += ` AND tfe.attribution_status = $${p}`; values.push(filters.attribution_status); p++; }
    if (filters.plate_number) { query += ` AND tfe.plate_number = $${p}`; values.push(filters.plate_number); p++; }
    if (filters.agreement_id) { query += ` AND tfe.agreement_id = $${p}`; values.push(filters.agreement_id); p++; }
    query += ' ORDER BY tfe.event_timestamp DESC';
    if (filters.limit) { query += ` LIMIT $${p}`; values.push(filters.limit); p++; }
    if (filters.offset) { query += ` OFFSET $${p}`; values.push(filters.offset); }
    const result = await pool.query(query, values);
    return result.rows;
  }
}

export default new TollFineEventModel();
