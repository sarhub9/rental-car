import pool from '../config/database.js';

class AdminReportsService {
  /**
   * Revenue summary for a given period
   */
  async getRevenueSummary(tenantId, period = 'month') {
    let interval;
    switch (period) {
      case 'week': interval = '7 days'; break;
      case 'month': interval = '30 days'; break;
      case 'quarter': interval = '90 days'; break;
      case 'year': interval = '365 days'; break;
      default: interval = '30 days';
    }

    const result = await pool.query(
      `SELECT
        COUNT(*)::int as total_invoices,
        COALESCE(SUM(total_amount), 0)::numeric as total_billed,
        COALESCE(SUM(amount_paid), 0)::numeric as total_collected,
        COALESCE(SUM(balance_due), 0)::numeric as total_outstanding,
        COALESCE(SUM(vat_amount), 0)::numeric as total_vat
       FROM invoices
       WHERE tenant_id = $1 AND created_at >= NOW() - $2::interval`,
      [tenantId, interval]
    );

    const row = result.rows[0];
    return {
      period,
      total_invoices: row.total_invoices,
      total_billed: parseFloat(row.total_billed),
      total_collected: parseFloat(row.total_collected),
      total_outstanding: parseFloat(row.total_outstanding),
      total_vat: parseFloat(row.total_vat),
      collection_rate: row.total_billed > 0
        ? Math.round((parseFloat(row.total_collected) / parseFloat(row.total_billed)) * 100)
        : 0,
    };
  }

  /**
   * Receivables breakdown
   */
  async getReceivables(tenantId) {
    const result = await pool.query(
      `SELECT
        i.status,
        COUNT(*)::int as count,
        COALESCE(SUM(i.balance_due), 0)::numeric as total_due
       FROM invoices i
       WHERE i.tenant_id = $1 AND i.status IN ('ISSUED', 'PARTIALLY_PAID', 'OVERDUE')
       GROUP BY i.status`,
      [tenantId]
    );

    const receivables = result.rows.map((r) => ({
      status: r.status,
      count: r.count,
      total_due: parseFloat(r.total_due),
    }));

    const totalDue = receivables.reduce((sum, r) => sum + r.total_due, 0);

    return {
      breakdown: receivables,
      total_receivable: totalDue,
    };
  }

  /**
   * Agreement statistics
   */
  async getAgreementStats(tenantId) {
    const result = await pool.query(
      `SELECT
        status,
        COUNT(*)::int as count
       FROM rental_agreements
       WHERE tenant_id = $1
       GROUP BY status`,
      [tenantId]
    );

    const stats = {};
    for (const row of result.rows) {
      stats[row.status.toLowerCase()] = row.count;
    }

    // Average rental duration for closed agreements
    const durationResult = await pool.query(
      `SELECT
        AVG(EXTRACT(EPOCH FROM (return_timestamp - checkout_timestamp)) / 86400)::numeric as avg_days
       FROM rental_agreements
       WHERE tenant_id = $1 AND status = 'CLOSED' AND return_timestamp IS NOT NULL AND checkout_timestamp IS NOT NULL`,
      [tenantId]
    );

    return {
      by_status: stats,
      total: Object.values(stats).reduce((a, b) => a + b, 0),
      avg_rental_days: durationResult.rows[0]?.avg_days
        ? parseFloat(parseFloat(durationResult.rows[0].avg_days).toFixed(1))
        : 0,
    };
  }
}

export default new AdminReportsService();
