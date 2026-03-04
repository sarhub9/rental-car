import AdminDashboardService from '../services/admin-dashboard.service.js';
import AdminReportsService from '../services/admin-reports.service.js';
import VehicleService from '../services/vehicle.service.js';
import pool from '../config/database.js';

class AdminDashboardController {
  async getDashboard(req, res) {
    try {
      const data = await AdminDashboardService.getDashboardKPIs(req.tenantId);

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      console.error('Dashboard error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to load dashboard',
      });
    }
  }

  async getRevenue(req, res) {
    try {
      const period = req.query.period || 'month';
      const data = await AdminReportsService.getRevenueSummary(req.tenantId, period);

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      console.error('Revenue report error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to load revenue report',
      });
    }
  }

  async getReceivables(req, res) {
    try {
      const data = await AdminReportsService.getReceivables(req.tenantId);

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      console.error('Receivables report error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to load receivables report',
      });
    }
  }

  async getAgreementStats(req, res) {
    try {
      const data = await AdminReportsService.getAgreementStats(req.tenantId);

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      console.error('Agreement stats error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to load agreement stats',
      });
    }
  }

  async getVehicleStats(req, res) {
    try {
      const result = await pool.query(
        `SELECT
          status,
          COUNT(*)::int as count
         FROM vehicles
         WHERE tenant_id = $1
         GROUP BY status`,
        [req.tenantId]
      );

      const stats = {};
      let total = 0;
      for (const row of result.rows) {
        stats[row.status.toLowerCase()] = row.count;
        total += row.count;
      }

      return res.status(200).json({
        success: true,
        data: {
          by_status: stats,
          total,
        },
      });
    } catch (error) {
      console.error('Vehicle stats error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to load vehicle stats',
      });
    }
  }
}

export default new AdminDashboardController();
