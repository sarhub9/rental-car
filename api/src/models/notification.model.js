import pool from '../config/database.js';

class NotificationModel {
  async create(data) {
    const query = `
      INSERT INTO notifications (
        tenant_id, user_id, title, body, data, notification_type, sent_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [
      data.tenant_id, data.user_id, data.title, data.body,
      data.data ? JSON.stringify(data.data) : null,
      data.notification_type, data.sent_at || new Date(),
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async list(userId, tenantId, filters = {}) {
    let query = 'SELECT * FROM notifications WHERE user_id = $1 AND tenant_id = $2';
    const values = [userId, tenantId];
    let p = 3;

    if (filters.unread_only) {
      query += ' AND is_read = FALSE';
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      query += ` LIMIT $${p}`;
      values.push(filters.limit);
      p++;
    }
    if (filters.offset) {
      query += ` OFFSET $${p}`;
      values.push(filters.offset);
    }

    const result = await pool.query(query, values);
    return result.rows;
  }

  async markAsRead(notificationId, userId) {
    const query = `
      UPDATE notifications SET is_read = TRUE, read_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [notificationId, userId]);
    return result.rows[0];
  }

  async markAllAsRead(userId, tenantId) {
    const query = `
      UPDATE notifications SET is_read = TRUE, read_at = NOW()
      WHERE user_id = $1 AND tenant_id = $2 AND is_read = FALSE
    `;
    await pool.query(query, [userId, tenantId]);
  }

  async getUnreadCount(userId, tenantId) {
    const query = `
      SELECT COUNT(*) AS count FROM notifications
      WHERE user_id = $1 AND tenant_id = $2 AND is_read = FALSE
    `;
    const result = await pool.query(query, [userId, tenantId]);
    return parseInt(result.rows[0].count, 10);
  }

  // Device token methods
  async registerDevice(data) {
    const query = `
      INSERT INTO device_tokens (user_id, tenant_id, fcm_token, device_type, device_name)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (fcm_token) DO UPDATE SET
        user_id = $1, is_active = TRUE, last_used_at = NOW()
      RETURNING *
    `;
    const values = [data.user_id, data.tenant_id, data.fcm_token, data.device_type, data.device_name || null];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async getActiveDeviceTokens(userId) {
    const query = 'SELECT * FROM device_tokens WHERE user_id = $1 AND is_active = TRUE';
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  async deactivateDevice(fcmToken) {
    const query = 'UPDATE device_tokens SET is_active = FALSE WHERE fcm_token = $1';
    await pool.query(query, [fcmToken]);
  }
}

export default new NotificationModel();
