import pool from '../config/database.js';

class OtpModel {
  async create(data) {
    const query = `
      INSERT INTO otp_verifications (
        phone_number, tenant_id, otp_code, purpose, expires_at
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [
      data.phone_number,
      data.tenant_id,
      data.otp_code,
      data.purpose || 'LOGIN',
      data.expires_at,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async findLatestActive(phoneNumber, tenantId, purpose = 'LOGIN') {
    const query = `
      SELECT * FROM otp_verifications
      WHERE phone_number = $1
        AND tenant_id = $2
        AND purpose = $3
        AND is_verified = FALSE
        AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const result = await pool.query(query, [phoneNumber, tenantId, purpose]);
    return result.rows[0];
  }

  async incrementAttempts(otpId) {
    const query = `
      UPDATE otp_verifications
      SET attempts = attempts + 1
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [otpId]);
    return result.rows[0];
  }

  async markVerified(otpId) {
    const query = `
      UPDATE otp_verifications
      SET is_verified = TRUE, verified_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [otpId]);
    return result.rows[0];
  }

  async invalidateAll(phoneNumber, tenantId, purpose = 'LOGIN') {
    const query = `
      UPDATE otp_verifications
      SET expires_at = NOW()
      WHERE phone_number = $1
        AND tenant_id = $2
        AND purpose = $3
        AND is_verified = FALSE
        AND expires_at > NOW()
    `;
    await pool.query(query, [phoneNumber, tenantId, purpose]);
  }

  async countRecentRequests(phoneNumber, tenantId, minutes = 15) {
    const query = `
      SELECT COUNT(*) as count FROM otp_verifications
      WHERE phone_number = $1
        AND tenant_id = $2
        AND created_at > NOW() - INTERVAL '1 minute' * $3
    `;
    const result = await pool.query(query, [phoneNumber, tenantId, minutes]);
    return parseInt(result.rows[0].count, 10);
  }

  async deleteExpired() {
    const query = `
      DELETE FROM otp_verifications
      WHERE expires_at < NOW() - INTERVAL '1 day'
    `;
    const result = await pool.query(query);
    return result.rowCount;
  }
}

export default new OtpModel();
