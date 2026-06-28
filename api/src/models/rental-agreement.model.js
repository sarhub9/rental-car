import pool from '../config/database.js';

/**
 * RentalAgreement Model
 * Handles database operations for rental agreements
 */
class RentalAgreementModel {
  /**
   * Create a new rental agreement
   */
  async create(data) {
    try {
      const query = `
        INSERT INTO rental_agreements (
          tenant_id, agreement_number, customer_id, vehicle_id,
          rental_start_datetime, rental_end_datetime,
          daily_rate, weekly_rate, estimated_amount, created_by_user_id,
          rate_plan_id, rate_plan_name,
          snapshot_included_km, snapshot_extra_km_rate, snapshot_deposit_amount,
          snapshot_fuel_policy, snapshot_late_return_rules,
          snapshot_add_ons, snapshot_terms_text,
          monthly_rate, km_allowance_per_day, rate_per_extra_km,
          salik_charges, fines_charges, damages_charges, fuel_charges, extra_km_charges,
          delivery_charges, pickup_charges, extra_hour_charges, other_charges,
          deposit_amount, cdw_amount, excess_insurance_amount, deposit_waiver_amount,
          additional_remarks,
          additional_driver_name, additional_driver_license, additional_driver_license_expiry,
          additional_driver_eid, additional_driver_dob,
          status
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,
          $23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,$39,$40,$41,'DRAFT')
        RETURNING *
      `;

      const values = [
        data.tenant_id, data.agreement_number, data.customer_id, data.vehicle_id,
        data.rental_start_datetime, data.rental_end_datetime,
        data.daily_rate, data.weekly_rate, data.estimated_amount, data.created_by_user_id,
        data.rate_plan_id || null, data.rate_plan_name || null,
        data.snapshot_included_km || null, data.snapshot_extra_km_rate || null,
        data.snapshot_deposit_amount || null,
        data.snapshot_fuel_policy ? (typeof data.snapshot_fuel_policy === 'string' ? data.snapshot_fuel_policy : JSON.stringify(data.snapshot_fuel_policy)) : null,
        data.snapshot_late_return_rules ? (typeof data.snapshot_late_return_rules === 'string' ? data.snapshot_late_return_rules : JSON.stringify(data.snapshot_late_return_rules)) : null,
        data.snapshot_add_ons ? (typeof data.snapshot_add_ons === 'string' ? data.snapshot_add_ons : JSON.stringify(data.snapshot_add_ons)) : null,
        data.snapshot_terms_text || null,
        data.monthly_rate || null, data.km_allowance_per_day || null, data.rate_per_extra_km || null,
        data.salik_charges || 0, data.fines_charges || 0, data.damages_charges || 0,
        data.fuel_charges || 0, data.extra_km_charges || 0,
        data.delivery_charges || 0, data.pickup_charges || 0, data.extra_hour_charges || 0,
        data.other_charges || 0,
        data.deposit_amount || 0, data.cdw_amount || 0, data.excess_insurance_amount || 0,
        data.deposit_waiver_amount || 0,
        data.additional_remarks || null,
        data.additional_driver_name || null, data.additional_driver_license || null,
        data.additional_driver_license_expiry || null,
        data.additional_driver_eid || null, data.additional_driver_dob || null,
      ];

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (err) {
      if (err.code === '42703') {
        const fallbackQuery = `
          INSERT INTO rental_agreements (
            tenant_id, agreement_number, customer_id, vehicle_id,
            rental_start_datetime, rental_end_datetime,
            daily_rate, weekly_rate, estimated_amount, created_by_user_id,
            status
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'DRAFT')
          RETURNING *
        `;
        const values = [
          data.tenant_id, data.agreement_number, data.customer_id, data.vehicle_id,
          data.rental_start_datetime, data.rental_end_datetime,
          data.daily_rate, data.weekly_rate, data.estimated_amount, data.created_by_user_id,
        ];
        const result = await pool.query(fallbackQuery, values);
        return result.rows[0];
      }
      throw err;
    }
  }

  /**
   * Save the customer signature URL (allowed at any status).
   */
  async setSignature(id, tenantId, signatureUrl) {
    const query = `
      UPDATE rental_agreements
      SET customer_signature_url = $1
      WHERE id = $2 AND tenant_id = $3
      RETURNING *
    `;
    const result = await pool.query(query, [signatureUrl, id, tenantId]);
    return result.rows[0];
  }

  /**
   * Save the officer/company-representative signature URL (any status).
   */
  async setOfficerSignature(id, tenantId, signatureUrl) {
    const query = `
      UPDATE rental_agreements
      SET officer_signature_url = $1
      WHERE id = $2 AND tenant_id = $3
      RETURNING *
    `;
    const result = await pool.query(query, [signatureUrl, id, tenantId]);
    return result.rows[0];
  }

  /**
   * Save the vehicle inspection JSON (checklist + photos + notes, any status).
   */
  async saveInspection(id, tenantId, inspection) {
    const query = `
      UPDATE rental_agreements
      SET inspection = $1
      WHERE id = $2 AND tenant_id = $3
      RETURNING *
    `;
    const payload = typeof inspection === 'string' ? inspection : JSON.stringify(inspection);
    const result = await pool.query(query, [payload, id, tenantId]);
    return result.rows[0];
  }

  /**
   * Update a draft agreement
   */
  async update(id, tenantId, data) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(data[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id, tenantId);

    const query = `
      UPDATE rental_agreements
      SET ${fields.join(', ')}
      WHERE id = $${paramCount} AND tenant_id = $${paramCount + 1} AND status = 'DRAFT'
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Find agreement by ID
   */
  async findById(id, tenantId) {
    const query = `
      SELECT
        ra.*,
        row_to_json(c.*) as customer,
        row_to_json(v.*) as vehicle,
        row_to_json(co.*) as company
      FROM rental_agreements ra
      LEFT JOIN customers c ON ra.customer_id = c.id AND c.tenant_id = ra.tenant_id
      LEFT JOIN vehicles v ON ra.vehicle_id = v.id AND v.tenant_id = ra.tenant_id
      LEFT JOIN companies co ON co.id = ra.tenant_id
      WHERE ra.id = $1 AND ra.tenant_id = $2
    `;

    const result = await pool.query(query, [id, tenantId]);
    return result.rows[0];
  }

  /**
   * List agreements with filters
   */
  async list(tenantId, filters = {}) {
    let query = `
      SELECT
        ra.*,
        COALESCE(c.full_name_en, 'Unknown Customer') as customer_name,
        COALESCE(v.year::text || ' ' || v.make || ' ' || v.model, 'Unknown Vehicle') as vehicle_info
      FROM rental_agreements ra
      LEFT JOIN customers c ON ra.customer_id = c.id AND c.tenant_id = ra.tenant_id
      LEFT JOIN vehicles v ON ra.vehicle_id = v.id AND v.tenant_id = ra.tenant_id
      WHERE ra.tenant_id = $1
    `;
    const values = [tenantId];
    let paramCount = 2;

    if (filters.status) {
      query += ` AND ra.status = $${paramCount}`;
      values.push(filters.status);
      paramCount++;
    }

    if (filters.customer_id) {
      query += ` AND ra.customer_id = $${paramCount}`;
      values.push(filters.customer_id);
      paramCount++;
    }

    if (filters.vehicle_id) {
      query += ` AND ra.vehicle_id = $${paramCount}`;
      values.push(filters.vehicle_id);
      paramCount++;
    }

    query += ` ORDER BY ra.created_at DESC`;

    if (filters.limit) {
      query += ` LIMIT $${paramCount}`;
      values.push(filters.limit);
      paramCount++;
    }

    if (filters.offset !== undefined && filters.offset !== null) {
      query += ` OFFSET $${paramCount}`;
      values.push(filters.offset);
      paramCount++;
    }

    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Count agreements with filters
   */
  async count(tenantId, filters = {}) {
    let query = `
      SELECT COUNT(*) as count
      FROM rental_agreements
      WHERE tenant_id = $1
    `;
    const values = [tenantId];
    let paramCount = 2;

    if (filters.status) {
      query += ` AND status = $${paramCount}`;
      values.push(filters.status);
      paramCount++;
    }

    if (filters.customer_id) {
      query += ` AND customer_id = $${paramCount}`;
      values.push(filters.customer_id);
      paramCount++;
    }

    if (filters.vehicle_id) {
      query += ` AND vehicle_id = $${paramCount}`;
      values.push(filters.vehicle_id);
      paramCount++;
    }

    const result = await pool.query(query, values);
    return parseInt(result.rows[0].count);
  }

  /**
   * Update agreement status
   */
  async updateStatus(id, tenantId, newStatus, timestamp = null) {
    const timestampField =
      newStatus === 'ACTIVE' ? 'checkout_timestamp' : newStatus === 'CLOSED' ? 'return_timestamp' : null;

    let query = `
      UPDATE rental_agreements
      SET status = $1
    `;

    const values = [newStatus];
    let paramCount = 2;

    if (timestampField && timestamp) {
      query += `, ${timestampField} = $${paramCount}`;
      values.push(timestamp);
      paramCount++;
    }

    query += ` WHERE id = $${paramCount} AND tenant_id = $${paramCount + 1} RETURNING *`;
    values.push(id, tenantId);

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Check vehicle availability for date range
   */
  async checkVehicleAvailability(vehicleId, tenantId, startDate, endDate, excludeAgreementId = null) {
    let query = `
      SELECT id, agreement_number, rental_start_datetime, rental_end_datetime
      FROM rental_agreements
      WHERE vehicle_id = $1
        AND tenant_id = $2
        AND status IN ('DRAFT', 'ACTIVE')
        AND (
          (rental_start_datetime <= $3 AND rental_end_datetime >= $3)
          OR (rental_start_datetime <= $4 AND rental_end_datetime >= $4)
          OR (rental_start_datetime >= $3 AND rental_end_datetime <= $4)
        )
    `;

    const values = [vehicleId, tenantId, startDate, endDate];

    if (excludeAgreementId) {
      query += ` AND id != $5`;
      values.push(excludeAgreementId);
    }

    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Generate next agreement number for tenant
   */
  async generateAgreementNumber(tenantId) {
    const year = new Date().getFullYear();
    const query = `
      SELECT agreement_number
      FROM rental_agreements
      WHERE tenant_id = $1 AND agreement_number LIKE $2
      ORDER BY agreement_number DESC
      LIMIT 1
    `;

    const result = await pool.query(query, [tenantId, `RA-${year}-%`]);

    if (result.rows.length === 0) {
      return `RA-${year}-00001`;
    }

    const lastNumber = result.rows[0].agreement_number;
    const sequence = parseInt(lastNumber.split('-')[2]) + 1;
    return `RA-${year}-${sequence.toString().padStart(5, '0')}`;
  }
}

export default new RentalAgreementModel();
