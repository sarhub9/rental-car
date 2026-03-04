import pool from '../config/database.js';

class RefreshTokenModel {
  async create(data) {
    const query = `
      INSERT INTO refresh_tokens (user_id, token_hash, device_info, expires_at)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [data.user_id, data.token_hash, data.device_info || null, data.expires_at];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async findByTokenHash(tokenHash) {
    const query = `
      SELECT * FROM refresh_tokens
      WHERE token_hash = $1
        AND is_revoked = FALSE
        AND expires_at > NOW()
    `;
    const result = await pool.query(query, [tokenHash]);
    return result.rows[0];
  }

  async revokeByUser(userId) {
    const query = `
      UPDATE refresh_tokens SET is_revoked = TRUE
      WHERE user_id = $1 AND is_revoked = FALSE
    `;
    await pool.query(query, [userId]);
  }

  async revokeByTokenHash(tokenHash) {
    const query = `
      UPDATE refresh_tokens SET is_revoked = TRUE
      WHERE token_hash = $1
    `;
    await pool.query(query, [tokenHash]);
  }

  async deleteExpired() {
    const query = `
      DELETE FROM refresh_tokens
      WHERE expires_at < NOW() OR is_revoked = TRUE
    `;
    const result = await pool.query(query);
    return result.rowCount;
  }
}

export default new RefreshTokenModel();
