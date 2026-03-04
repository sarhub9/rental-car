import pool from '../config/database.js';

/**
 * LocationUpdate Model
 * Handles database operations for GPS location tracking during active tasks
 */
class LocationUpdateModel {
  /**
   * Batch insert location updates for a task
   * Returns the count of inserted rows
   */
  async bulkCreate(updates, tenantId) {
    if (!updates || updates.length === 0) {
      return 0;
    }

    const columns = [
      'tenant_id',
      'task_id',
      'driver_id',
      'latitude',
      'longitude',
      'accuracy_meters',
      'speed_kmh',
      'recorded_at',
    ];

    const valuePlaceholders = [];
    const values = [];
    let paramCount = 1;

    for (const update of updates) {
      const placeholders = [];
      for (let i = 0; i < columns.length; i++) {
        placeholders.push(`$${paramCount}`);
        paramCount++;
      }
      valuePlaceholders.push(`(${placeholders.join(', ')})`);

      values.push(
        tenantId,
        update.task_id,
        update.driver_id,
        update.latitude,
        update.longitude,
        update.accuracy_meters || null,
        update.speed_kmh || null,
        update.recorded_at,
      );
    }

    const query = `
      INSERT INTO location_updates (${columns.join(', ')})
      VALUES ${valuePlaceholders.join(', ')}
    `;

    const result = await pool.query(query, values);
    return result.rowCount;
  }

  /**
   * Find all location points for a task ordered by recorded time
   */
  async findByTaskId(taskId, tenantId) {
    const query = `
      SELECT * FROM location_updates
      WHERE task_id = $1 AND tenant_id = $2
      ORDER BY recorded_at ASC
    `;

    const result = await pool.query(query, [taskId, tenantId]);
    return result.rows;
  }
}

export default new LocationUpdateModel();
