import pool from '../config/database.js';

/**
 * RecoveryAttempt Model
 * Handles database operations for recovery contact/visit attempt logs
 */
class RecoveryAttemptModel {
  /**
   * Create a new recovery attempt record
   */
  async create(data) {
    const query = `
      INSERT INTO recovery_attempts (
        tenant_id,
        task_id,
        attempt_type,
        outcome,
        notes,
        attempted_by
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      data.tenant_id,
      data.task_id,
      data.attempt_type,
      data.outcome,
      data.notes || null,
      data.attempted_by,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Find all recovery attempts for a task ordered by attempt time
   */
  async findByTaskId(taskId, tenantId) {
    const query = `
      SELECT * FROM recovery_attempts
      WHERE task_id = $1 AND tenant_id = $2
      ORDER BY attempted_at DESC
    `;

    const result = await pool.query(query, [taskId, tenantId]);
    return result.rows;
  }

  /**
   * Count recovery attempts for a task
   */
  async countByTaskId(taskId, tenantId) {
    const query = `
      SELECT COUNT(*) AS total
      FROM recovery_attempts
      WHERE task_id = $1 AND tenant_id = $2
    `;

    const result = await pool.query(query, [taskId, tenantId]);
    return parseInt(result.rows[0].total, 10);
  }
}

export default new RecoveryAttemptModel();
