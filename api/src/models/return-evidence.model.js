import pool from '../config/database.js';

/**
 * ReturnEvidence Model
 * Handles database operations for return evidence
 */
class ReturnEvidenceModel {
  /**
   * Create return evidence
   */
  async create(data) {
    const values = [
      data.tenant_id,
      data.agreement_id,
      data.odometer_reading,
      data.fuel_level,
      data.kilometers_driven,
      data.damage_documented || false,
      data.damage_description,
      data.customer_acknowledgment,
      data.acknowledgment_timestamp,
      data.captured_by_user_id,
    ];

    // First try updating an existing row for idempotent retries.
    const updateQuery = `
      UPDATE return_evidence
      SET
        odometer_reading = $3,
        fuel_level = $4,
        kilometers_driven = $5,
        damage_documented = $6,
        damage_description = $7,
        customer_acknowledgment = $8,
        acknowledgment_timestamp = $9,
        captured_by_user_id = $10
      WHERE agreement_id = $2 AND tenant_id = $1
      RETURNING *
    `;
    const updated = await pool.query(updateQuery, values);
    if (updated.rows[0]) {
      return updated.rows[0];
    }

    const insertQuery = `
      INSERT INTO return_evidence (
        tenant_id,
        agreement_id,
        odometer_reading,
        fuel_level,
        kilometers_driven,
        damage_documented,
        damage_description,
        customer_acknowledgment,
        acknowledgment_timestamp,
        captured_by_user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    try {
      const inserted = await pool.query(insertQuery, values);
      return inserted.rows[0];
    } catch (error) {
      // Race safety: if another request inserted first, re-run update and return it.
      if (error?.code === '23505') {
        const racedUpdate = await pool.query(updateQuery, values);
        if (racedUpdate.rows[0]) {
          return racedUpdate.rows[0];
        }
      }
      throw error;
    }
  }

  /**
   * Update existing return evidence by agreement
   */
  async updateByAgreementId(agreementId, tenantId, data) {
    const query = `
      UPDATE return_evidence
      SET
        odometer_reading = $3,
        fuel_level = $4,
        kilometers_driven = $5,
        damage_documented = $6,
        damage_description = $7,
        customer_acknowledgment = $8,
        acknowledgment_timestamp = $9,
        captured_by_user_id = $10
      WHERE agreement_id = $1 AND tenant_id = $2
      RETURNING *
    `;

    const values = [
      agreementId,
      tenantId,
      data.odometer_reading,
      data.fuel_level,
      data.kilometers_driven,
      data.damage_documented || false,
      data.damage_description,
      data.customer_acknowledgment,
      data.acknowledgment_timestamp,
      data.captured_by_user_id,
    ];

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Find return evidence by agreement ID
   */
  async findByAgreementId(agreementId, tenantId) {
    const query = `
      SELECT * FROM return_evidence
      WHERE agreement_id = $1 AND tenant_id = $2
    `;

    const result = await pool.query(query, [agreementId, tenantId]);
    return result.rows[0];
  }

  /**
   * Check if return evidence exists
   */
  async exists(agreementId, tenantId) {
    const query = `
      SELECT EXISTS(
        SELECT 1 FROM return_evidence
        WHERE agreement_id = $1 AND tenant_id = $2
      ) as exists
    `;

    const result = await pool.query(query, [agreementId, tenantId]);
    return result.rows[0].exists;
  }
}

export default new ReturnEvidenceModel();
