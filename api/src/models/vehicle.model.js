import pool from '../config/database.js';

class VehicleModel {
  async create(data) {
    const query = `
      INSERT INTO vehicles (
        tenant_id, vehicle_number, category_id, make, model, year,
        color, plate_number, plate_emirate, chassis_number,
        transmission_type, fuel_type, status, daily_rate, weekly_rate,
        current_odometer, registration_expiry, insurance_expiry
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `;
    const values = [
      data.tenant_id, data.vehicle_number, data.category_id,
      data.make, data.model, data.year, data.color,
      data.plate_number, data.plate_emirate, data.chassis_number,
      data.transmission_type || 'AUTOMATIC', data.fuel_type || 'PETROL',
      data.status || 'AVAILABLE', data.daily_rate, data.weekly_rate,
      data.current_odometer || 0, data.registration_expiry, data.insurance_expiry,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async findById(id, tenantId) {
    const query = `
      SELECT v.*, vc.category_name, vc.category_code
      FROM vehicles v
      LEFT JOIN vehicle_categories vc ON vc.id = v.category_id
      WHERE v.id = $1 AND v.tenant_id = $2
    `;
    const result = await pool.query(query, [id, tenantId]);
    return result.rows[0];
  }

  async list(tenantId, filters = {}) {
    let query = `
      SELECT v.*, vc.category_name, vc.category_code
      FROM vehicles v
      LEFT JOIN vehicle_categories vc ON vc.id = v.category_id
      WHERE v.tenant_id = $1
    `;
    const values = [tenantId];
    let p = 2;

    if (filters.status) {
      query += ` AND v.status = $${p}`;
      values.push(filters.status);
      p++;
    }
    if (filters.category_id) {
      query += ` AND v.category_id = $${p}`;
      values.push(filters.category_id);
      p++;
    }

    query += ' ORDER BY v.created_at DESC';

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

  async update(id, tenantId, data) {
    const fields = [];
    const values = [];
    let p = 1;

    const allowedFields = [
      'category_id', 'make', 'model', 'year', 'color',
      'plate_number', 'plate_emirate', 'chassis_number',
      'transmission_type', 'fuel_type', 'status',
      'daily_rate', 'weekly_rate', 'current_odometer',
      'registration_expiry', 'insurance_expiry',
    ];

    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${p}`);
        values.push(data[key]);
        p++;
      }
    }

    if (fields.length === 0) throw new Error('No fields to update');

    values.push(id, tenantId);
    const query = `
      UPDATE vehicles SET ${fields.join(', ')}
      WHERE id = $${p} AND tenant_id = $${p + 1}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async searchAvailable(tenantId, startDate, endDate) {
    try {
      const query = `
        SELECT v.*, vc.category_name, vc.category_code
        FROM vehicles v
        LEFT JOIN vehicle_categories vc ON vc.id = v.category_id
        WHERE v.tenant_id = $1
          AND v.status = 'AVAILABLE'
          AND NOT EXISTS (
            SELECT 1 FROM vehicle_availability va
            WHERE va.vehicle_id = v.id
              AND va.lock_start < $3
              AND va.lock_end > $2
          )
        ORDER BY v.make, v.model
      `;
      const result = await pool.query(query, [tenantId, startDate, endDate]);
      return result.rows;
    } catch (err) {
      if (err.message?.includes('vehicle_availability') || err.code === '42P01') {
        const fallback = `
          SELECT v.*, vc.category_name, vc.category_code
          FROM vehicles v
          LEFT JOIN vehicle_categories vc ON vc.id = v.category_id
          WHERE v.tenant_id = $1
            AND v.status = 'AVAILABLE'
            AND v.id NOT IN (
              SELECT ra.vehicle_id FROM rental_agreements ra
              WHERE ra.tenant_id = $1
                AND ra.status IN ('DRAFT', 'ACTIVE')
                AND ra.rental_start_datetime <= $3
                AND ra.rental_end_datetime >= $2
            )
          ORDER BY v.make, v.model
        `;
        const result = await pool.query(fallback, [tenantId, startDate, endDate]);
        return result.rows;
      }
      throw err;
    }
  }

  async checkMaintenanceStatus(vehicleId, tenantId) {
    try {
      const query = `
        SELECT wo.id, wo.work_order_number, wo.status, wo.type,
               wo.next_maintenance_km, wo.next_maintenance_date
        FROM work_orders wo
        WHERE wo.vehicle_id = $1 AND wo.tenant_id = $2
          AND wo.status IN ('open', 'in_progress')
        ORDER BY wo.created_at DESC
        LIMIT 1
      `;
      const result = await pool.query(query, [vehicleId, tenantId]);
      return result.rows[0] || null;
    } catch (err) {
      if (err.message?.includes('work_orders') || err.code === '42P01') {
        return null;
      }
      throw err;
    }
  }

  async generateVehicleNumber(tenantId) {
    const query = `
      SELECT vehicle_number FROM vehicles
      WHERE tenant_id = $1
      ORDER BY vehicle_number DESC
      LIMIT 1
    `;
    const result = await pool.query(query, [tenantId]);

    if (result.rows.length === 0) return 'VEH-00001';

    const last = result.rows[0].vehicle_number;
    const seq = parseInt(last.split('-')[1]) + 1;
    return `VEH-${seq.toString().padStart(5, '0')}`;
  }
}

export default new VehicleModel();
