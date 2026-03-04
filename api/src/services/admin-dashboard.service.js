import pool from '../config/database.js';

class AdminDashboardService {
  /**
   * Get dashboard KPIs for admin
   */
  async getDashboardKPIs(tenantId) {
    // Run all queries in parallel
    const [
      activeAgreements,
      revenue,
      fleetUtilization,
      overdueReturns,
      recentActivity,
      monthlyTrend,
    ] = await Promise.all([
      this._getActiveAgreementsCount(tenantId),
      this._getTotalRevenue(tenantId),
      this._getFleetUtilization(tenantId),
      this._getOverdueReturns(tenantId),
      this._getRecentActivity(tenantId),
      this._getMonthlyTrend(tenantId),
    ]);

    return {
      active_agreements: activeAgreements,
      total_revenue: revenue,
      fleet_utilization_percent: fleetUtilization,
      overdue_returns: overdueReturns,
      recent_activity: recentActivity,
      monthly_trend: monthlyTrend,
    };
  }

  async _getActiveAgreementsCount(tenantId) {
    const result = await pool.query(
      `SELECT COUNT(*)::int as count FROM rental_agreements WHERE tenant_id = $1 AND status = 'ACTIVE'`,
      [tenantId]
    );
    return result.rows[0].count;
  }

  async _getTotalRevenue(tenantId) {
    const result = await pool.query(
      `SELECT COALESCE(SUM(amount_paid), 0)::numeric as total
       FROM invoices WHERE tenant_id = $1 AND status IN ('PAID', 'PARTIALLY_PAID')`,
      [tenantId]
    );
    return parseFloat(result.rows[0].total);
  }

  async _getFleetUtilization(tenantId) {
    const result = await pool.query(
      `SELECT
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE status = 'RENTED')::int as rented
       FROM vehicles WHERE tenant_id = $1 AND status != 'OUT_OF_SERVICE'`,
      [tenantId]
    );
    const { total, rented } = result.rows[0];
    return total > 0 ? Math.round((rented / total) * 100) : 0;
  }

  async _getOverdueReturns(tenantId) {
    const result = await pool.query(
      `SELECT COUNT(*)::int as count
       FROM rental_agreements
       WHERE tenant_id = $1 AND status = 'ACTIVE' AND rental_end_datetime < NOW()`,
      [tenantId]
    );
    return result.rows[0].count;
  }

  async _getRecentActivity(tenantId) {
    const result = await pool.query(
      `SELECT id, event_type, event_description, user_id, event_timestamp
       FROM agreement_audit_log
       WHERE tenant_id = $1
       ORDER BY event_timestamp DESC
       LIMIT 10`,
      [tenantId]
    );
    return result.rows;
  }

  async _getMonthlyTrend(tenantId) {
    const result = await pool.query(
      `SELECT
        TO_CHAR(created_at, 'YYYY-MM') as month,
        COUNT(*)::int as agreements,
        COALESCE(SUM(estimated_amount), 0)::numeric as estimated_revenue
       FROM rental_agreements
       WHERE tenant_id = $1 AND created_at >= NOW() - INTERVAL '6 months'
       GROUP BY TO_CHAR(created_at, 'YYYY-MM')
       ORDER BY month DESC`,
      [tenantId]
    );
    return result.rows.map((r) => ({
      month: r.month,
      agreements: r.agreements,
      estimated_revenue: parseFloat(r.estimated_revenue),
    }));
  }
}

export default new AdminDashboardService();
