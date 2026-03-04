import pool from '../config/database.js';

/**
 * VehicleTask Model
 * Handles database operations for driver delivery, pickup, and recovery tasks
 */
class VehicleTaskModel {
  /**
   * Create a new vehicle task
   */
  async create(data) {
    const query = `
      INSERT INTO vehicle_tasks (
        tenant_id,
        agreement_id,
        vehicle_id,
        customer_id,
        assigned_driver_id,
        task_type,
        status,
        priority,
        destination_address,
        destination_latitude,
        destination_longitude,
        scheduled_at,
        admin_notes,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;

    const values = [
      data.tenant_id,
      data.agreement_id,
      data.vehicle_id,
      data.customer_id,
      data.assigned_driver_id,
      data.task_type,
      data.status || 'ASSIGNED',
      data.priority || 'NORMAL',
      data.destination_address,
      data.destination_latitude || null,
      data.destination_longitude || null,
      data.scheduled_at,
      data.admin_notes || null,
      data.created_by,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Find task by ID with joined vehicle, customer, and agreement details
   */
  async findById(id, tenantId) {
    const query = `
      SELECT
        vt.*,
        v.plate_number,
        v.make,
        v.model,
        v.color,
        c.full_name_en AS customer_name,
        c.phone_number AS customer_phone,
        ra.agreement_number
      FROM vehicle_tasks vt
      LEFT JOIN vehicles v ON v.id = vt.vehicle_id
      LEFT JOIN customers c ON c.id = vt.customer_id
      LEFT JOIN rental_agreements ra ON ra.id = vt.agreement_id
      WHERE vt.id = $1 AND vt.tenant_id = $2
    `;

    const result = await pool.query(query, [id, tenantId]);
    return result.rows[0];
  }

  /**
   * Find tasks assigned to a specific driver with optional filters
   */
  async findByDriver(driverId, tenantId, filters = {}) {
    let query = `
      SELECT
        vt.*,
        v.plate_number,
        v.make,
        v.model,
        v.color,
        c.full_name_en AS customer_name,
        c.phone_number AS customer_phone,
        ra.agreement_number,
        (SELECT COUNT(*) FROM task_evidence_photos tep WHERE tep.task_id = vt.id AND tep.tenant_id = vt.tenant_id) AS evidence_photos_count,
        (SELECT COUNT(*) FROM task_damage_records tdr WHERE tdr.task_id = vt.id AND tdr.tenant_id = vt.tenant_id) AS damages_count,
        (SELECT COUNT(*) FROM recovery_attempts rat WHERE rat.task_id = vt.id AND rat.tenant_id = vt.tenant_id) AS recovery_attempts_count
      FROM vehicle_tasks vt
      LEFT JOIN vehicles v ON v.id = vt.vehicle_id
      LEFT JOIN customers c ON c.id = vt.customer_id
      LEFT JOIN rental_agreements ra ON ra.id = vt.agreement_id
      WHERE vt.assigned_driver_id = $1 AND vt.tenant_id = $2
    `;
    const values = [driverId, tenantId];
    let paramCount = 3;

    if (filters.date) {
      query += ` AND DATE(vt.scheduled_at AT TIME ZONE 'UTC') = $${paramCount}`;
      values.push(filters.date);
      paramCount++;
    }

    if (filters.status) {
      query += ` AND vt.status = $${paramCount}`;
      values.push(filters.status);
      paramCount++;
    }

    if (filters.type) {
      query += ` AND vt.task_type = $${paramCount}`;
      values.push(filters.type);
      paramCount++;
    }

    query += `
      ORDER BY
        CASE vt.status
          WHEN 'IN_PROGRESS' THEN 1
          WHEN 'ASSIGNED' THEN 2
          WHEN 'COMPLETED' THEN 3
          ELSE 4
        END,
        CASE WHEN vt.status = 'ASSIGNED' THEN vt.scheduled_at END ASC,
        CASE WHEN vt.status = 'COMPLETED' THEN vt.completed_at END DESC
    `;

    const limit = filters.limit || 20;
    const page = filters.page || 1;
    const offset = (page - 1) * limit;

    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Get dashboard stats for a driver on a given date
   */
  async getDashboardStats(driverId, tenantId, date) {
    const query = `
      SELECT
        COUNT(*) FILTER (WHERE status = 'COMPLETED' AND DATE(completed_at AT TIME ZONE 'UTC') = $3) AS completed_today,
        COUNT(*) FILTER (WHERE status = 'ASSIGNED') AS pending,
        COUNT(*) FILTER (WHERE status = 'IN_PROGRESS') AS in_progress
      FROM vehicle_tasks
      WHERE assigned_driver_id = $1 AND tenant_id = $2
    `;

    const result = await pool.query(query, [driverId, tenantId, date]);
    const row = result.rows[0];
    return {
      completed_today: parseInt(row.completed_today, 10) || 0,
      pending: parseInt(row.pending, 10) || 0,
      in_progress: parseInt(row.in_progress, 10) || 0,
    };
  }

  /**
   * Update task status with optional extra fields
   */
  async updateStatus(id, tenantId, status, extraFields = {}) {
    const fields = ['status = $1'];
    const values = [status];
    let paramCount = 2;

    Object.keys(extraFields).forEach((key) => {
      if (extraFields[key] !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(extraFields[key]);
        paramCount++;
      }
    });

    values.push(id, tenantId);

    const query = `
      UPDATE vehicle_tasks
      SET ${fields.join(', ')}
      WHERE id = $${paramCount} AND tenant_id = $${paramCount + 1}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Update evidence-related fields on a task
   */
  async updateEvidence(id, tenantId, data) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    const allowedFields = [
      'odometer_reading',
      'fuel_level',
      'condition_notes',
      'customer_confirmation_type',
      'customer_confirmation_at',
      'signature_url',
    ];

    allowedFields.forEach((key) => {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(data[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No evidence fields to update');
    }

    values.push(id, tenantId);

    const query = `
      UPDATE vehicle_tasks
      SET ${fields.join(', ')}
      WHERE id = $${paramCount} AND tenant_id = $${paramCount + 1}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Get completed task history for a driver with date range and performance summary
   */
  async getHistory(driverId, tenantId, filters = {}) {
    let query = `
      SELECT
        vt.*,
        v.plate_number,
        v.make,
        v.model,
        ra.agreement_number
      FROM vehicle_tasks vt
      LEFT JOIN vehicles v ON v.id = vt.vehicle_id
      LEFT JOIN rental_agreements ra ON ra.id = vt.agreement_id
      WHERE vt.assigned_driver_id = $1
        AND vt.tenant_id = $2
        AND vt.status = 'COMPLETED'
    `;
    const values = [driverId, tenantId];
    let paramCount = 3;

    if (filters.from) {
      query += ` AND vt.completed_at >= $${paramCount}`;
      values.push(filters.from);
      paramCount++;
    }

    if (filters.to) {
      query += ` AND vt.completed_at <= $${paramCount}`;
      values.push(filters.to);
      paramCount++;
    }

    if (filters.type) {
      query += ` AND vt.task_type = $${paramCount}`;
      values.push(filters.type);
      paramCount++;
    }

    query += ` ORDER BY vt.completed_at DESC`;

    const limit = filters.limit || 20;
    const page = filters.page || 1;
    const offset = (page - 1) * limit;

    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const tasksResult = await pool.query(query, values);

    // Compute performance summary
    const summaryQuery = `
      SELECT
        COUNT(*) FILTER (WHERE DATE(completed_at AT TIME ZONE 'UTC') = CURRENT_DATE) AS today,
        COUNT(*) FILTER (WHERE completed_at >= DATE_TRUNC('week', CURRENT_DATE)) AS this_week,
        COUNT(*) FILTER (WHERE completed_at >= DATE_TRUNC('month', CURRENT_DATE)) AS this_month,
        task_type
      FROM vehicle_tasks
      WHERE assigned_driver_id = $1
        AND tenant_id = $2
        AND status = 'COMPLETED'
      GROUP BY task_type
    `;

    const summaryResult = await pool.query(summaryQuery, [driverId, tenantId]);

    const performance = {};
    for (const row of summaryResult.rows) {
      performance[row.task_type] = {
        today: parseInt(row.today, 10) || 0,
        this_week: parseInt(row.this_week, 10) || 0,
        this_month: parseInt(row.this_month, 10) || 0,
      };
    }

    return {
      tasks: tasksResult.rows,
      performance,
    };
  }

  /**
   * Count tasks for pagination
   */
  async count(tenantId, filters = {}) {
    let query = `
      SELECT COUNT(*) AS total
      FROM vehicle_tasks
      WHERE tenant_id = $1
    `;
    const values = [tenantId];
    let paramCount = 2;

    if (filters.assigned_driver_id) {
      query += ` AND assigned_driver_id = $${paramCount}`;
      values.push(filters.assigned_driver_id);
      paramCount++;
    }

    if (filters.status) {
      query += ` AND status = $${paramCount}`;
      values.push(filters.status);
      paramCount++;
    }

    if (filters.task_type) {
      query += ` AND task_type = $${paramCount}`;
      values.push(filters.task_type);
      paramCount++;
    }

    if (filters.date) {
      query += ` AND DATE(scheduled_at AT TIME ZONE 'UTC') = $${paramCount}`;
      values.push(filters.date);
      paramCount++;
    }

    const result = await pool.query(query, values);
    return parseInt(result.rows[0].total, 10);
  }
}

export default new VehicleTaskModel();
