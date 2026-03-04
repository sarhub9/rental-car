import pool from '../config/database.js';

/**
 * CheckoutEvidence Model
 * Handles database operations for checkout evidence
 */
class CheckoutEvidenceModel {
  /**
   * Create checkout evidence
   */
  async create(data) {
    const query = `
      INSERT INTO checkout_evidence (
        tenant_id,
        agreement_id,
        odometer_reading,
        fuel_level,
        accessories,
        customer_signature_url,
        customer_otp_verified,
        otp_verification_timestamp,
        captured_by_user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      data.tenant_id,
      data.agreement_id,
      data.odometer_reading,
      data.fuel_level,
      data.accessories ? JSON.stringify(data.accessories) : null,
      data.customer_signature_url,
      data.customer_otp_verified || false,
      data.otp_verification_timestamp,
      data.captured_by_user_id,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Find checkout evidence by agreement ID
   */
  async findByAgreementId(agreementId, tenantId) {
    const query = `
      SELECT * FROM checkout_evidence
      WHERE agreement_id = $1 AND tenant_id = $2
    `;

    const result = await pool.query(query, [agreementId, tenantId]);
    return result.rows[0];
  }

  /**
   * Check if checkout evidence exists
   */
  async exists(agreementId, tenantId) {
    const query = `
      SELECT EXISTS(
        SELECT 1 FROM checkout_evidence
        WHERE agreement_id = $1 AND tenant_id = $2
      ) as exists
    `;

    const result = await pool.query(query, [agreementId, tenantId]);
    return result.rows[0].exists;
  }
}

export default new CheckoutEvidenceModel();
