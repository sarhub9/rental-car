import pool from '../config/database.js';

/**
 * PhotoEvidence Model
 * Handles database operations for photo evidence
 */
class PhotoEvidenceModel {
  /**
   * Create photo evidence
   */
  async create(data) {
    const query = `
      INSERT INTO photo_evidence (
        tenant_id,
        agreement_id,
        evidence_type,
        photo_angle,
        photo_url,
        photo_thumbnail_url,
        file_size_bytes,
        mime_type,
        captured_timestamp,
        gps_latitude,
        gps_longitude,
        gps_accuracy_meters,
        device_info
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const values = [
      data.tenant_id,
      data.agreement_id,
      data.evidence_type,
      data.photo_angle,
      data.photo_url,
      data.photo_thumbnail_url,
      data.file_size_bytes,
      data.mime_type,
      data.captured_timestamp,
      data.gps_latitude,
      data.gps_longitude,
      data.gps_accuracy_meters,
      data.device_info ? JSON.stringify(data.device_info) : null,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Find photos by agreement and evidence type
   */
  async findByAgreementAndType(agreementId, tenantId, evidenceType) {
    const query = `
      SELECT * FROM photo_evidence
      WHERE agreement_id = $1 AND tenant_id = $2 AND evidence_type = $3
      ORDER BY uploaded_at ASC
    `;

    const result = await pool.query(query, [agreementId, tenantId, evidenceType]);
    return result.rows;
  }

  /**
   * Count photos by agreement and evidence type
   */
  async countByAgreementAndType(agreementId, tenantId, evidenceType) {
    const query = `
      SELECT COUNT(*) as count FROM photo_evidence
      WHERE agreement_id = $1 AND tenant_id = $2 AND evidence_type = $3
    `;

    const result = await pool.query(query, [agreementId, tenantId, evidenceType]);
    return parseInt(result.rows[0].count);
  }

  /**
   * Delete photos by agreement and evidence type
   */
  async deleteByAgreementAndType(agreementId, tenantId, evidenceType) {
    const query = `
      DELETE FROM photo_evidence
      WHERE agreement_id = $1 AND tenant_id = $2 AND evidence_type = $3
    `;
    await pool.query(query, [agreementId, tenantId, evidenceType]);
  }

  /**
   * Get all photos for agreement
   */
  async findByAgreementId(agreementId, tenantId) {
    const query = `
      SELECT * FROM photo_evidence
      WHERE agreement_id = $1 AND tenant_id = $2
      ORDER BY evidence_type, uploaded_at ASC
    `;

    const result = await pool.query(query, [agreementId, tenantId]);
    return result.rows;
  }
}

export default new PhotoEvidenceModel();
