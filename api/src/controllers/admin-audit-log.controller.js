import pool from '../config/database.js';

class AdminAuditLogController {
  async list(req, res) {
    try {
      const {
        event_type,
        user_id,
        start_date,
        end_date,
        limit = 50,
        offset = 0,
      } = req.query;

      let query = `
        SELECT
          a.id, a.agreement_id, a.event_type, a.event_description,
          a.old_status, a.new_status, a.user_id, a.event_timestamp,
          a.ip_address, a.event_data,
          u.full_name as user_name
        FROM agreement_audit_log a
        LEFT JOIN users u ON a.user_id = u.id
        WHERE a.tenant_id = $1
      `;
      const values = [req.tenantId];
      let p = 2;

      if (event_type) {
        query += ` AND a.event_type = $${p}`;
        values.push(event_type);
        p++;
      }

      if (user_id) {
        query += ` AND a.user_id = $${p}`;
        values.push(user_id);
        p++;
      }

      if (start_date) {
        query += ` AND a.event_timestamp >= $${p}`;
        values.push(start_date);
        p++;
      }

      if (end_date) {
        query += ` AND a.event_timestamp <= $${p}`;
        values.push(end_date);
        p++;
      }

      query += ` ORDER BY a.event_timestamp DESC`;
      query += ` LIMIT $${p}`;
      values.push(parseInt(limit, 10));
      p++;
      query += ` OFFSET $${p}`;
      values.push(parseInt(offset, 10));

      const result = await pool.query(query, values);

      return res.status(200).json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      console.error('Audit log list error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to list audit logs',
      });
    }
  }
}

export default new AdminAuditLogController();
