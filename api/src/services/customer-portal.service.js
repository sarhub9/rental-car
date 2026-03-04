import pool from '../config/database.js';

class CustomerPortalService {
  /**
   * Get dashboard data for a customer
   */
  async getDashboardData(customerId, tenantId) {
    // Aggregate counts
    const countsQuery = `
      SELECT
        COUNT(*) FILTER (WHERE status = 'ACTIVE') AS active_rentals_count,
        COUNT(*) AS total_rentals
      FROM rental_agreements
      WHERE customer_id = $1 AND tenant_id = $2
    `;
    const countsResult = await pool.query(countsQuery, [customerId, tenantId]);
    const counts = countsResult.rows[0];

    // Pending charges (from active agreements)
    const chargesQuery = `
      SELECT COALESCE(SUM(agc.amount), 0) AS pending_charges
      FROM auto_generated_charges agc
      JOIN rental_agreements ra ON agc.agreement_id = ra.id
      WHERE ra.customer_id = $1
        AND ra.tenant_id = $2
        AND agc.approval_status IN ('AUTO_APPROVED', 'APPROVED')
    `;
    const chargesResult = await pool.query(chargesQuery, [customerId, tenantId]);

    // Recent agreements (last 5)
    const recentQuery = `
      SELECT * FROM rental_agreements
      WHERE customer_id = $1 AND tenant_id = $2
      ORDER BY created_at DESC
      LIMIT 5
    `;
    const recentResult = await pool.query(recentQuery, [customerId, tenantId]);

    // Upcoming returns (active agreements ending within 7 days)
    const upcomingQuery = `
      SELECT * FROM rental_agreements
      WHERE customer_id = $1
        AND tenant_id = $2
        AND status = 'ACTIVE'
        AND rental_end_datetime <= NOW() + INTERVAL '7 days'
      ORDER BY rental_end_datetime ASC
    `;
    const upcomingResult = await pool.query(upcomingQuery, [customerId, tenantId]);

    return {
      active_rentals_count: parseInt(counts.active_rentals_count, 10),
      total_rentals: parseInt(counts.total_rentals, 10),
      pending_charges: parseFloat(chargesResult.rows[0].pending_charges),
      recent_agreements: recentResult.rows,
      upcoming_returns: upcomingResult.rows,
    };
  }

  /**
   * Get customer's agreements with filters
   */
  async getMyAgreements(customerId, tenantId, filters = {}) {
    let query = `
      SELECT ra.*, c.full_name_en AS customer_name, v.make AS vehicle_make,
             v.model AS vehicle_model, v.plate_number
      FROM rental_agreements ra
      LEFT JOIN customers c ON ra.customer_id = c.id
      LEFT JOIN vehicles v ON ra.vehicle_id = v.id
      WHERE ra.customer_id = $1 AND ra.tenant_id = $2
    `;
    const values = [customerId, tenantId];
    let p = 3;

    if (filters.status) {
      query += ` AND ra.status = $${p}`;
      values.push(filters.status);
      p++;
    }

    if (filters.search) {
      query += ` AND ra.agreement_number ILIKE $${p}`;
      values.push(`%${filters.search}%`);
      p++;
    }

    query += ' ORDER BY ra.created_at DESC';

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

  /**
   * Get agreement detail with ownership check
   */
  async getAgreementDetail(agreementId, customerId, tenantId) {
    const query = `
      SELECT ra.*, c.full_name_en AS customer_name, c.phone_number AS customer_phone,
             v.make AS vehicle_make, v.model AS vehicle_model, v.year AS vehicle_year,
             v.plate_number, v.plate_emirate, v.color AS vehicle_color
      FROM rental_agreements ra
      LEFT JOIN customers c ON ra.customer_id = c.id
      LEFT JOIN vehicles v ON ra.vehicle_id = v.id
      WHERE ra.id = $1 AND ra.customer_id = $2 AND ra.tenant_id = $3
    `;
    const result = await pool.query(query, [agreementId, customerId, tenantId]);

    if (result.rows.length === 0) {
      const error = new Error('Agreement not found');
      error.statusCode = 404;
      throw error;
    }

    return result.rows[0];
  }

  /**
   * Get evidence for agreement (with ownership check)
   */
  async getAgreementEvidence(agreementId, customerId, tenantId) {
    // Verify ownership
    await this.getAgreementDetail(agreementId, customerId, tenantId);

    const checkoutQuery = `
      SELECT ce.*, json_agg(pe.*) AS photos
      FROM checkout_evidence ce
      LEFT JOIN photo_evidence pe ON pe.agreement_id = ce.agreement_id AND pe.evidence_type = 'CHECKOUT'
      WHERE ce.agreement_id = $1 AND ce.tenant_id = $2
      GROUP BY ce.id
    `;

    const returnQuery = `
      SELECT re.*, json_agg(pe.*) AS photos
      FROM return_evidence re
      LEFT JOIN photo_evidence pe ON pe.agreement_id = re.agreement_id AND pe.evidence_type = 'RETURN'
      WHERE re.agreement_id = $1 AND re.tenant_id = $2
      GROUP BY re.id
    `;

    const [checkoutResult, returnResult] = await Promise.all([
      pool.query(checkoutQuery, [agreementId, tenantId]),
      pool.query(returnQuery, [agreementId, tenantId]),
    ]);

    return {
      checkout: checkoutResult.rows[0] || null,
      return: returnResult.rows[0] || null,
    };
  }

  /**
   * Get charges for agreement (with ownership check)
   */
  async getAgreementCharges(agreementId, customerId, tenantId) {
    // Verify ownership
    await this.getAgreementDetail(agreementId, customerId, tenantId);

    const query = `
      SELECT * FROM auto_generated_charges
      WHERE agreement_id = $1 AND tenant_id = $2
      ORDER BY generated_at ASC
    `;
    const result = await pool.query(query, [agreementId, tenantId]);
    return result.rows;
  }
}

export default new CustomerPortalService();
