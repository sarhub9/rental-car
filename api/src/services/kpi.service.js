import pool from '../config/database.js';

class KpiService {
  buildDateFilter(alias, filters, values, p) {
    let clause = '';
    if (filters.date_from) { clause += ` AND ${alias}.created_at >= $${p}`; values.push(filters.date_from); p++; }
    if (filters.date_to) { clause += ` AND ${alias}.created_at <= $${p}`; values.push(filters.date_to); p++; }
    return { clause, p };
  }

  async getFleetKpis(tenantId, filters = {}) {
    const dateFrom = filters.date_from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const dateTo = filters.date_to || new Date().toISOString();
    const totalDays = Math.max(1, Math.ceil((new Date(dateTo) - new Date(dateFrom)) / (1000 * 60 * 60 * 24)));

    const vehicleQuery = `SELECT COUNT(*) as total_vehicles FROM vehicles WHERE tenant_id = $1 AND status != 'OUT_OF_SERVICE'`;
    const vehicleResult = await pool.query(vehicleQuery, [tenantId]);
    const totalVehicles = parseInt(vehicleResult.rows[0].total_vehicles);

    const rentedQuery = `
      SELECT COALESCE(SUM(
        LEAST(EXTRACT(EPOCH FROM LEAST(ra.return_timestamp, $3::timestamptz) - GREATEST(ra.checkout_timestamp, $2::timestamptz)) / 86400, $4)
      ), 0) as rented_days
      FROM rental_agreements ra
      WHERE ra.tenant_id = $1 AND ra.status IN ('ACTIVE','CLOSED')
        AND ra.checkout_timestamp IS NOT NULL
        AND ra.checkout_timestamp < $3 AND (ra.return_timestamp IS NULL OR ra.return_timestamp > $2)
    `;
    const rentedResult = await pool.query(rentedQuery, [tenantId, dateFrom, dateTo, totalDays]);
    const rentedDays = parseFloat(rentedResult.rows[0].rented_days || 0);

    const downtimeQuery = `
      SELECT COALESCE(SUM(downtime_days), 0) as total_downtime
      FROM work_orders WHERE tenant_id = $1 AND status = 'completed'
        AND completed_at >= $2 AND completed_at <= $3
    `;
    const downtimeResult = await pool.query(downtimeQuery, [tenantId, dateFrom, dateTo]);
    const downtimeDays = parseInt(downtimeResult.rows[0].total_downtime || 0);

    const totalAvailableDays = totalVehicles * totalDays;
    const utilization = totalAvailableDays > 0 ? ((rentedDays / totalAvailableDays) * 100) : 0;
    const idleDays = Math.max(0, totalAvailableDays - rentedDays - downtimeDays);

    return {
      total_vehicles: totalVehicles,
      period_days: totalDays,
      utilization_percent: parseFloat(utilization.toFixed(1)),
      rented_days: parseFloat(rentedDays.toFixed(1)),
      idle_days: parseFloat(idleDays.toFixed(1)),
      downtime_days: downtimeDays,
    };
  }

  async getRevenueKpis(tenantId, filters = {}) {
    const dateFrom = filters.date_from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const dateTo = filters.date_to || new Date().toISOString();

    const baseQuery = `
      SELECT COALESCE(SUM(estimated_amount), 0) as base_revenue,
             COALESCE(SUM(actual_amount), 0) as total_revenue,
             COUNT(*) as closed_agreements
      FROM rental_agreements
      WHERE tenant_id = $1 AND status = 'CLOSED'
        AND return_timestamp >= $2 AND return_timestamp <= $3
    `;
    const baseResult = await pool.query(baseQuery, [tenantId, dateFrom, dateTo]);
    const base = baseResult.rows[0];

    const chargesQuery = `
      SELECT agc.charge_type, COALESCE(SUM(agc.amount), 0) as total
      FROM auto_generated_charges agc
      JOIN rental_agreements ra ON ra.id = agc.agreement_id
      WHERE agc.tenant_id = $1 AND ra.status = 'CLOSED'
        AND ra.return_timestamp >= $2 AND ra.return_timestamp <= $3
        AND agc.approval_status IN ('AUTO_APPROVED', 'APPROVED')
      GROUP BY agc.charge_type
    `;
    const chargesResult = await pool.query(chargesQuery, [tenantId, dateFrom, dateTo]);
    const byType = {};
    chargesResult.rows.forEach(r => { byType[r.charge_type] = parseFloat(r.total); });

    return {
      base_rental_revenue: parseFloat(base.base_revenue),
      total_revenue: parseFloat(base.total_revenue),
      closed_agreements: parseInt(base.closed_agreements),
      extra_km_revenue: byType['EXTRA_KM'] || 0,
      late_fee_revenue: byType['LATE_FEE'] || 0,
      fuel_revenue: byType['FUEL'] || 0,
      damage_revenue: byType['DAMAGE'] || 0,
      extras_total: Object.values(byType).reduce((s, v) => s + v, 0),
    };
  }

  async getRiskKpis(tenantId, filters = {}) {
    const dateFrom = filters.date_from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const dateTo = filters.date_to || new Date().toISOString();

    const agreementCount = await pool.query(
      `SELECT COUNT(*) as total FROM rental_agreements WHERE tenant_id = $1 AND status = 'CLOSED' AND return_timestamp >= $2 AND return_timestamp <= $3`,
      [tenantId, dateFrom, dateTo]
    );
    const total = parseInt(agreementCount.rows[0].total) || 1;

    const damageCount = await pool.query(
      `SELECT COUNT(DISTINCT agc.agreement_id) as damage_count FROM auto_generated_charges agc JOIN rental_agreements ra ON ra.id = agc.agreement_id WHERE agc.tenant_id = $1 AND agc.charge_type = 'DAMAGE' AND ra.return_timestamp >= $2 AND ra.return_timestamp <= $3`,
      [tenantId, dateFrom, dateTo]
    );

    const overdueCount = await pool.query(
      `SELECT COUNT(*) as overdue FROM rental_agreements WHERE tenant_id = $1 AND status = 'CLOSED' AND return_timestamp > rental_end_datetime AND return_timestamp >= $2 AND return_timestamp <= $3`,
      [tenantId, dateFrom, dateTo]
    );

    return {
      damage_frequency: parseFloat(((parseInt(damageCount.rows[0].damage_count) / total) * 100).toFixed(1)),
      damage_incidents: parseInt(damageCount.rows[0].damage_count),
      overdue_return_count: parseInt(overdueCount.rows[0].overdue),
      overdue_return_rate: parseFloat(((parseInt(overdueCount.rows[0].overdue) / total) * 100).toFixed(1)),
      total_closed_agreements: total,
    };
  }

  async getProfitKpis(tenantId, filters = {}) {
    const dateFrom = filters.date_from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const dateTo = filters.date_to || new Date().toISOString();

    const revenueQuery = `
      SELECT v.id, v.vehicle_number, v.make, v.model,
             COALESCE(SUM(ra.actual_amount), 0) as total_revenue,
             COUNT(ra.id) as rental_count
      FROM vehicles v
      LEFT JOIN rental_agreements ra ON ra.vehicle_id = v.id AND ra.status = 'CLOSED'
        AND ra.return_timestamp >= $2 AND ra.return_timestamp <= $3
      WHERE v.tenant_id = $1
      GROUP BY v.id, v.vehicle_number, v.make, v.model
    `;
    const revenueResult = await pool.query(revenueQuery, [tenantId, dateFrom, dateTo]);

    const costQuery = `
      SELECT wo.vehicle_id, COALESCE(SUM(wo.actual_cost), 0) as total_cost
      FROM work_orders wo
      WHERE wo.tenant_id = $1 AND wo.status = 'completed'
        AND wo.completed_at >= $2 AND wo.completed_at <= $3
      GROUP BY wo.vehicle_id
    `;
    const costResult = await pool.query(costQuery, [tenantId, dateFrom, dateTo]);
    const costMap = {};
    costResult.rows.forEach(r => { costMap[r.vehicle_id] = parseFloat(r.total_cost); });

    const vehicles = revenueResult.rows.map(v => {
      const revenue = parseFloat(v.total_revenue);
      const cost = costMap[v.id] || 0;
      return {
        vehicle_id: v.id, vehicle_number: v.vehicle_number,
        make: v.make, model: v.model,
        total_revenue: revenue, total_cost: cost,
        margin: parseFloat((revenue - cost).toFixed(2)),
        rental_count: parseInt(v.rental_count),
      };
    });

    const totalRevenue = vehicles.reduce((s, v) => s + v.total_revenue, 0);
    const totalCost = vehicles.reduce((s, v) => s + v.total_cost, 0);

    return {
      total_revenue: totalRevenue,
      total_cost: totalCost,
      total_margin: parseFloat((totalRevenue - totalCost).toFixed(2)),
      vehicles,
    };
  }

  async getDashboardSummary(tenantId, filters = {}) {
    const [fleet, revenue, risk, profit] = await Promise.all([
      this.getFleetKpis(tenantId, filters),
      this.getRevenueKpis(tenantId, filters),
      this.getRiskKpis(tenantId, filters),
      this.getProfitKpis(tenantId, filters),
    ]);
    return { fleet, revenue, risk, profit };
  }
}

export default new KpiService();
