import pool from '../config/database.js';

class VehicleAvailabilityModel {
  async createLock(data) {
    const query = `
      INSERT INTO vehicle_availability (
        tenant_id, vehicle_id, agreement_id, lock_start, lock_end,
        lock_type, created_by_user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [
      data.tenant_id, data.vehicle_id, data.agreement_id,
      data.lock_start, data.lock_end, data.lock_type,
      data.created_by_user_id,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async releaseLock(agreementId, tenantId) {
    const query = `
      DELETE FROM vehicle_availability
      WHERE agreement_id = $1 AND tenant_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [agreementId, tenantId]);
    return result.rows;
  }

  async findConflicts(vehicleId, tenantId, startDate, endDate, excludeAgreementId = null) {
    let query = `
      SELECT va.*, ra.agreement_number
      FROM vehicle_availability va
      LEFT JOIN rental_agreements ra ON ra.id = va.agreement_id
      WHERE va.vehicle_id = $1
        AND va.tenant_id = $2
        AND va.lock_start < $4
        AND va.lock_end > $3
    `;
    const values = [vehicleId, tenantId, startDate, endDate];

    if (excludeAgreementId) {
      query += ` AND (va.agreement_id IS NULL OR va.agreement_id != $5)`;
      values.push(excludeAgreementId);
    }

    const result = await pool.query(query, values);
    return result.rows;
  }

  async findByAgreementId(agreementId, tenantId) {
    const query = `
      SELECT * FROM vehicle_availability
      WHERE agreement_id = $1 AND tenant_id = $2
    `;
    const result = await pool.query(query, [agreementId, tenantId]);
    return result.rows[0];
  }

  async findByVehicleId(vehicleId, tenantId, startDate, endDate) {
    const query = `
      SELECT va.*, ra.agreement_number
      FROM vehicle_availability va
      LEFT JOIN rental_agreements ra ON ra.id = va.agreement_id
      WHERE va.vehicle_id = $1
        AND va.tenant_id = $2
        AND va.lock_start < $4
        AND va.lock_end > $3
      ORDER BY va.lock_start
    `;
    const result = await pool.query(query, [vehicleId, tenantId, startDate, endDate]);
    return result.rows;
  }

  async releaseLockById(lockId, tenantId) {
    const query = `
      DELETE FROM vehicle_availability
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [lockId, tenantId]);
    return result.rows[0];
  }
}

export default new VehicleAvailabilityModel();
