import pool from '../config/database.js';

class ReservationModel {
  async create(data) {
    const query = `
      INSERT INTO reservations (
        tenant_id, reservation_number, customer_id, vehicle_id, vehicle_category_id,
        rate_plan_id, branch_id, status, source, pickup_datetime, return_datetime,
        estimated_amount, deposit_required, deposit_amount, corporate_account_id,
        notes, created_by_user_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      RETURNING *
    `;
    const values = [
      data.tenant_id, data.reservation_number,
      data.customer_id, data.vehicle_id || null, data.vehicle_category_id || null,
      data.rate_plan_id || null, data.branch_id || null,
      data.status || 'DRAFT', data.source || 'COUNTER',
      data.pickup_datetime, data.return_datetime,
      data.estimated_amount || null,
      data.deposit_required || false, data.deposit_amount || 0,
      data.corporate_account_id || null,
      data.notes || null, data.created_by_user_id,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async findById(id, tenantId) {
    const query = `
      SELECT r.*,
        c.full_name_en AS customer_name, c.phone_number AS customer_phone,
        v.plate_number, v.make, v.model,
        vc.category_name,
        rp.plan_name AS rate_plan_name
      FROM reservations r
      LEFT JOIN customers c ON c.id = r.customer_id
      LEFT JOIN vehicles v ON v.id = r.vehicle_id
      LEFT JOIN vehicle_categories vc ON vc.id = r.vehicle_category_id
      LEFT JOIN rate_plans rp ON rp.id = r.rate_plan_id
      WHERE r.id = $1 AND r.tenant_id = $2
    `;
    const result = await pool.query(query, [id, tenantId]);
    return result.rows[0];
  }

  async list(tenantId, filters = {}) {
    let query = `
      SELECT r.*,
        c.full_name_en AS customer_name,
        v.plate_number, v.make, v.model
      FROM reservations r
      LEFT JOIN customers c ON c.id = r.customer_id
      LEFT JOIN vehicles v ON v.id = r.vehicle_id
      WHERE r.tenant_id = $1
    `;
    const values = [tenantId];
    let p = 2;

    if (filters.status) { query += ` AND r.status = $${p}`; values.push(filters.status); p++; }
    if (filters.customer_id) { query += ` AND r.customer_id = $${p}`; values.push(filters.customer_id); p++; }
    if (filters.vehicle_id) { query += ` AND r.vehicle_id = $${p}`; values.push(filters.vehicle_id); p++; }

    query += ' ORDER BY r.pickup_datetime ASC';
    if (filters.limit) { query += ` LIMIT $${p}`; values.push(filters.limit); p++; }
    if (filters.offset) { query += ` OFFSET $${p}`; values.push(filters.offset); }

    const result = await pool.query(query, values);
    return result.rows;
  }

  async updateStatus(id, tenantId, newStatus, extraData = {}) {
    const setFields = ['status = $1'];
    const values = [newStatus];
    let p = 2;

    if (newStatus === 'CANCELLED') {
      setFields.push(`cancelled_at = NOW()`);
      if (extraData.cancellation_reason) {
        setFields.push(`cancellation_reason = $${p}`);
        values.push(extraData.cancellation_reason);
        p++;
      }
    }

    if (newStatus === 'CHECKED_OUT' && extraData.agreement_id) {
      setFields.push(`agreement_id = $${p}`);
      values.push(extraData.agreement_id);
      p++;
    }

    values.push(id, tenantId);
    const query = `UPDATE reservations SET ${setFields.join(', ')} WHERE id = $${p} AND tenant_id = $${p + 1} RETURNING *`;
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async update(id, tenantId, data) {
    const fields = [];
    const values = [];
    let p = 1;

    const allowed = [
      'vehicle_id', 'vehicle_category_id', 'rate_plan_id', 'branch_id',
      'pickup_datetime', 'return_datetime', 'estimated_amount',
      'deposit_required', 'deposit_amount', 'notes',
    ];

    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${p}`);
        values.push(data[key]);
        p++;
      }
    }

    if (fields.length === 0) throw new Error('No fields to update');

    values.push(id, tenantId);
    const query = `UPDATE reservations SET ${fields.join(', ')} WHERE id = $${p} AND tenant_id = $${p + 1} AND status = 'DRAFT' RETURNING *`;
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Create availability lock for CONFIRMED reservation
  async createLock(tenantId, vehicleId, reservationId, lockedFrom, lockedTo) {
    const result = await pool.query(
      `INSERT INTO reservation_locks (tenant_id, vehicle_id, reservation_id, locked_from, locked_to)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [tenantId, vehicleId, reservationId, lockedFrom, lockedTo]
    );
    return result.rows[0];
  }

  // Release lock (on cancellation or checkout)
  async releaseLock(reservationId) {
    await pool.query(
      'UPDATE reservation_locks SET is_active = FALSE WHERE reservation_id = $1',
      [reservationId]
    );
  }

  // Check if vehicle is locked during a date range
  async checkVehicleLocked(tenantId, vehicleId, fromDate, toDate, excludeReservationId = null) {
    let query = `
      SELECT rl.*, r.reservation_number
      FROM reservation_locks rl
      JOIN reservations r ON r.id = rl.reservation_id
      WHERE rl.tenant_id = $1 AND rl.vehicle_id = $2 AND rl.is_active = TRUE
        AND (
          (rl.locked_from <= $3 AND rl.locked_to >= $3)
          OR (rl.locked_from <= $4 AND rl.locked_to >= $4)
          OR (rl.locked_from >= $3 AND rl.locked_to <= $4)
        )
    `;
    const values = [tenantId, vehicleId, fromDate, toDate];

    if (excludeReservationId) {
      query += ' AND rl.reservation_id != $5';
      values.push(excludeReservationId);
    }

    const result = await pool.query(query, values);
    return result.rows;
  }

  async generateReservationNumber(tenantId) {
    const year = new Date().getFullYear();
    const result = await pool.query(
      `SELECT reservation_number FROM reservations WHERE tenant_id = $1 AND reservation_number LIKE $2 ORDER BY reservation_number DESC LIMIT 1`,
      [tenantId, `RES-${year}-%`]
    );
    if (result.rows.length === 0) return `RES-${year}-00001`;
    const seq = parseInt(result.rows[0].reservation_number.split('-')[2]) + 1;
    return `RES-${year}-${seq.toString().padStart(5, '0')}`;
  }
}

export default new ReservationModel();
