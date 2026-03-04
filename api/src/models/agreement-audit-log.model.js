import pool from '../config/database.js';

/**
 * AgreementAuditLog Model
 * Handles database operations for agreement audit logs
 */
class AgreementAuditLogModel {
  /**
   * Create audit log entry
   */
  async create(data) {
    const query = `
      INSERT INTO agreement_audit_log (
        tenant_id,
        agreement_id,
        event_type,
        event_description,
        old_status,
        new_status,
        user_id,
        ip_address,
        user_agent,
        event_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const values = [
      data.tenant_id,
      data.agreement_id,
      data.event_type,
      data.event_description,
      data.old_status,
      data.new_status,
      data.user_id,
      data.ip_address,
      data.user_agent,
      data.event_data ? JSON.stringify(data.event_data) : null,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Get audit trail for agreement
   */
  async getByAgreementId(agreementId, tenantId) {
    const query = `
      SELECT
        id,
        event_type,
        event_description,
        old_status,
        new_status,
        user_id,
        ip_address,
        event_timestamp,
        event_data
      FROM agreement_audit_log
      WHERE agreement_id = $1 AND tenant_id = $2
      ORDER BY event_timestamp DESC
    `;

    const result = await pool.query(query, [agreementId, tenantId]);
    return result.rows;
  }
}

export default new AgreementAuditLogModel();
