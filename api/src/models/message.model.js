import pool from '../config/database.js';

class MessageModel {
  /**
   * Create a new message thread
   */
  async createThread(data) {
    const { tenant_id, customer_id, created_by_user_id, subject } = data;
    const result = await pool.query(
      `INSERT INTO message_threads (tenant_id, customer_id, created_by_user_id, subject, status)
       VALUES ($1, $2, $3, $4, 'OPEN')
       RETURNING *`,
      [tenant_id, customer_id || null, created_by_user_id || null, subject],
    );
    return result.rows[0];
  }

  /**
   * Find thread by ID
   */
  async findThreadById(threadId, tenantId) {
    const result = await pool.query(
      `SELECT * FROM message_threads WHERE id = $1 AND tenant_id = $2`,
      [threadId, tenantId],
    );
    return result.rows[0];
  }

  /**
   * List threads for a customer
   */
  async listCustomerThreads(customerId, tenantId, userId, filters = {}) {
    const { status, limit = 50, offset = 0 } = filters;
    let query = `
      SELECT mt.*,
             (SELECT COUNT(*) FROM messages m WHERE m.thread_id = mt.id AND m.is_read = FALSE AND m.sender_role != 'RENTAL_CUSTOMER') as unread_count
      FROM message_threads mt
      WHERE mt.tenant_id = $1
        AND (
          ($2::uuid IS NOT NULL AND mt.customer_id = $2)
          OR ($3::uuid IS NOT NULL AND mt.created_by_user_id = $3)
        )
    `;
    const params = [tenantId, customerId || null, userId || null];
    let paramIndex = 4;

    if (status) {
      query += ` AND mt.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY mt.last_message_at DESC NULLS LAST, mt.created_at DESC`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * List all threads (admin)
   */
  async listThreads(tenantId, filters = {}) {
    const { status, limit = 50, offset = 0 } = filters;
    let query = `
      SELECT mt.*,
             c.full_name_en as customer_name,
             c.phone_number as customer_phone,
             u.full_name as customer_user_name,
             (SELECT COUNT(*) FROM messages m WHERE m.thread_id = mt.id AND m.is_read = FALSE AND m.sender_role = 'RENTAL_CUSTOMER') as unread_count,
             (SELECT m.message_text FROM messages m WHERE m.thread_id = mt.id ORDER BY m.created_at DESC LIMIT 1) as last_message
      FROM message_threads mt
      LEFT JOIN customers c ON mt.customer_id = c.id
      LEFT JOIN users u ON u.customer_id = mt.customer_id AND u.tenant_id = mt.tenant_id
      WHERE mt.tenant_id = $1
    `;
    const params = [tenantId];
    let paramIndex = 2;

    if (status) {
      query += ` AND mt.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY mt.last_message_at DESC NULLS LAST, mt.created_at DESC`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Update thread status
   */
  async updateThreadStatus(threadId, tenantId, status) {
    const result = await pool.query(
      `UPDATE message_threads
       SET status = $1, updated_at = NOW()
       WHERE id = $2 AND tenant_id = $3
       RETURNING *`,
      [status, threadId, tenantId],
    );
    return result.rows[0];
  }

  /**
   * Create a message in a thread
   */
  async createMessage(data) {
    const { thread_id, sender_user_id, sender_role, message_text, attachments = [] } = data;
    const result = await pool.query(
      `INSERT INTO messages (thread_id, sender_user_id, sender_role, message_text, attachments)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [thread_id, sender_user_id, sender_role, message_text, JSON.stringify(attachments)],
    );
    // Update thread's last_message_at so ordering stays correct
    await pool.query(
      `UPDATE message_threads SET last_message_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [thread_id],
    );
    return result.rows[0];
  }

  /**
   * Get messages for a thread
   */
  async getThreadMessages(threadId, filters = {}) {
    const { limit = 100, offset = 0 } = filters;
    const result = await pool.query(
      `SELECT m.*,
              u.full_name as sender_name
       FROM messages m
       LEFT JOIN users u ON m.sender_user_id = u.id
       WHERE m.thread_id = $1
       ORDER BY m.created_at ASC
       LIMIT $2 OFFSET $3`,
      [threadId, limit, offset],
    );
    return result.rows;
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(threadId, userId) {
    await pool.query(
      `UPDATE messages
       SET is_read = TRUE
       WHERE thread_id = $1 AND sender_user_id != $2 AND is_read = FALSE`,
      [threadId, userId],
    );
  }

  /**
   * Get unread message count for customer
   */
  async getCustomerUnreadCount(customerId, tenantId) {
    const result = await pool.query(
      `SELECT COUNT(*) as count
       FROM messages m
       JOIN message_threads mt ON m.thread_id = mt.id
       WHERE mt.customer_id = $1 AND mt.tenant_id = $2
         AND m.is_read = FALSE
         AND m.sender_role != 'RENTAL_CUSTOMER'`,
      [customerId, tenantId],
    );
    return parseInt(result.rows[0].count, 10);
  }
}

export default new MessageModel();
