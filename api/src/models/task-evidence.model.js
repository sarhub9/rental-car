import pool from '../config/database.js';

/**
 * TaskEvidence Model
 * Handles database operations for task evidence photos
 */
class TaskEvidenceModel {
  /**
   * Create a new task evidence photo record
   */
  async create(data) {
    const query = `
      INSERT INTO task_evidence_photos (
        tenant_id,
        task_id,
        photo_angle,
        photo_url,
        thumbnail_url,
        file_size_bytes,
        gps_latitude,
        gps_longitude,
        gps_accuracy_meters,
        captured_at,
        captured_by_user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const values = [
      data.tenant_id,
      data.task_id,
      data.photo_angle,
      data.photo_url,
      data.thumbnail_url,
      data.file_size_bytes,
      data.gps_latitude || null,
      data.gps_longitude || null,
      data.gps_accuracy_meters || null,
      data.captured_at,
      data.captured_by_user_id,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Find all evidence photos for a task ordered by capture time
   */
  async findByTaskId(taskId, tenantId) {
    const query = `
      SELECT * FROM task_evidence_photos
      WHERE task_id = $1 AND tenant_id = $2
      ORDER BY captured_at ASC
    `;

    const result = await pool.query(query, [taskId, tenantId]);
    return result.rows;
  }

  /**
   * Count evidence photos for a task
   */
  async countByTaskId(taskId, tenantId) {
    const query = `
      SELECT COUNT(*) AS total
      FROM task_evidence_photos
      WHERE task_id = $1 AND tenant_id = $2
    `;

    const result = await pool.query(query, [taskId, tenantId]);
    return parseInt(result.rows[0].total, 10);
  }
}

export default new TaskEvidenceModel();
