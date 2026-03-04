import KpiService from '../services/kpi.service.js';

class KpiController {
  getFilters(query) {
    return {
      date_from: query.date_from, date_to: query.date_to,
      branch_id: query.branch_id, vehicle_category_id: query.category_id,
    };
  }

  async getFleetKpis(req, res, next) {
    try {
      const data = await KpiService.getFleetKpis(req.user.tenantId, this.getFilters(req.query));
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async getRevenueKpis(req, res, next) {
    try {
      const data = await KpiService.getRevenueKpis(req.user.tenantId, this.getFilters(req.query));
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async getRiskKpis(req, res, next) {
    try {
      const data = await KpiService.getRiskKpis(req.user.tenantId, this.getFilters(req.query));
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async getProfitKpis(req, res, next) {
    try {
      const data = await KpiService.getProfitKpis(req.user.tenantId, this.getFilters(req.query));
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async getDashboardSummary(req, res, next) {
    try {
      const data = await KpiService.getDashboardSummary(req.user.tenantId, this.getFilters(req.query));
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }
}

export default new KpiController();
