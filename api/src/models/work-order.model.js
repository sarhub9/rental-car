import pool from '../config/database.js';

const VALID_TRANSITIONS = {
  open: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

class WorkOrderModel {
  async create(data) {
    const query = `
      INSERT INTO work_orders (
        tenant_id, work_order_number, vehicle_id, type, description,
        estimated_cost, scheduled_date, next_maintenance_km, next_maintenance_date,
        notes, created_by_user_id, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'open')
      RETURNING *
    `;
    const values = [
      data.tenant_id, data.work_order_number, data.vehicle_id,
      data.type || 'scheduled', data.description, data.estimated_cost,
      data.scheduled_date, data.next_maintenance_km, data.next_maintenance_date,
      data.notes, data.created_by_user_id,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async findById(id, tenantId) {
    const query = `
      SELECT wo.*, v.plate_number, v.make, v.model as vehicle_model, v.vehicle_number
      FROM work_orders wo
      JOIN vehicles v ON v.id = wo.vehicle_id
      WHERE wo.id = $1 AND wo.tenant_id = $2
    `;
    const result = await pool.query(query, [id, tenantId]);
    return result.rows[0];
  }

  async findByVehicleId(vehicleId, tenantId, filters = {}) {
    let query = 'SELECT * FROM work_orders WHERE vehicle_id = $1 AND tenant_id = $2';
    const values = [vehicleId, tenantId];
    let p = 3;
    if (filters.status) { query += ` AND status = $${p}`; values.push(filters.status); p++; }
    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, values);
    return result.rows;
  }

  async updateStatus(id, tenantId, newStatus, data = {}) {
    const existing = await this.findById(id, tenantId);
    if (!existing) throw Object.assign(new Error('Work order not found'), { statusCode: 404 });

    const allowed = VALID_TRANSITIONS[existing.status];
    if (!allowed || !allowed.includes(newStatus)) {
      throw Object.assign(new Error(`Invalid transition: ${existing.status} → ${newStatus}`), { statusCode: 409 });
    }

    const fields = ['status = $1'];
    const values = [newStatus];
    let p = 2;

    const extras = ['actual_cost', 'completed_at', 'started_at', 'downtime_days',
      'completed_by_user_id', 'notes', 'next_maintenance_km', 'next_maintenance_date'];
    for (const key of extras) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${p}`);
        values.push(data[key]);
        p++;
      }
    }

    values.push(id, tenantId);
    const query = `UPDATE work_orders SET ${fields.join(', ')} WHERE id = $${p} AND tenant_id = $${p + 1} RETURNING *`;
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async list(tenantId, filters = {}) {
    let query = `
      SELECT wo.*, v.plate_number, v.make, v.model as vehicle_model, v.vehicle_number
      FROM work_orders wo
      JOIN vehicles v ON v.id = wo.vehicle_id
      WHERE wo.tenant_id = $1
    `;
    const values = [tenantId];
    let p = 2;
    if (filters.status) { query += ` AND wo.status = $${p}`; values.push(filters.status); p++; }
    if (filters.vehicle_id) { query += ` AND wo.vehicle_id = $${p}`; values.push(filters.vehicle_id); p++; }
    query += ' ORDER BY wo.created_at DESC';
    if (filters.limit) { query += ` LIMIT $${p}`; values.push(filters.limit); p++; }
    if (filters.offset) { query += ` OFFSET $${p}`; values.push(filters.offset); }
    const result = await pool.query(query, values);
    return result.rows;
  }

  async getOverdueVehicles(tenantId) {
    const query = `
      SELECT v.id, v.vehicle_number, v.plate_number, v.make, v.model,
             v.current_odometer, wo.next_maintenance_km, wo.next_maintenance_date
      FROM vehicles v
      JOIN work_orders wo ON wo.vehicle_id = v.id AND wo.tenant_id = v.tenant_id
        AND wo.status = 'completed'
      WHERE v.tenant_id = $1 AND v.status != 'OUT_OF_SERVICE'
        AND (
          (wo.next_maintenance_km IS NOT NULL AND v.current_odometer >= wo.next_maintenance_km)
          OR (wo.next_maintenance_date IS NOT NULL AND wo.next_maintenance_date <= CURRENT_DATE)
        )
        AND NOT EXISTS (
          SELECT 1 FROM work_orders wo2
          WHERE wo2.vehicle_id = v.id AND wo2.status IN ('open', 'in_progress')
        )
      GROUP BY v.id, v.vehicle_number, v.plate_number, v.make, v.model,
               v.current_odometer, wo.next_maintenance_km, wo.next_maintenance_date
    `;
    const result = await pool.query(query, [tenantId]);
    return result.rows;
  }

  async isVehicleOverdue(vehicleId, tenantId) {
    const overdue = await this.getOverdueVehicles(tenantId);
    const found = overdue.find(v => v.id === vehicleId);
    return { overdue: !!found, details: found || null };
  }

  async generateWorkOrderNumber(tenantId) {
    const year = new Date().getFullYear();
    const query = `
      SELECT work_order_number FROM work_orders
      WHERE tenant_id = $1 AND work_order_number LIKE $2
      ORDER BY work_order_number DESC LIMIT 1
    `;
    const result = await pool.query(query, [tenantId, `WO-${year}-%`]);
    if (result.rows.length === 0) return `WO-${year}-00001`;
    const seq = parseInt(result.rows[0].work_order_number.split('-')[2]) + 1;
    return `WO-${year}-${seq.toString().padStart(5, '0')}`;
  }

  async getUpcoming(tenantId, daysAhead = 30) {
    const query = `
      SELECT DISTINCT ON (wo.vehicle_id)
        wo.*, v.plate_number, v.make, v.model as vehicle_model, v.vehicle_number
      FROM work_orders wo
      JOIN vehicles v ON v.id = wo.vehicle_id
      WHERE wo.tenant_id = $1 AND wo.status = 'completed'
        AND wo.next_maintenance_date IS NOT NULL
        AND wo.next_maintenance_date <= CURRENT_DATE + $2 * INTERVAL '1 day'
        AND wo.next_maintenance_date > CURRENT_DATE
      ORDER BY wo.vehicle_id, wo.completed_at DESC
    `;
    const result = await pool.query(query, [tenantId, daysAhead]);
    return result.rows;
  }
}

export default new WorkOrderModel();
