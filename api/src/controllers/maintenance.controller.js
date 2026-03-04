import MaintenanceService from '../services/maintenance.service.js';
import WorkOrderModel from '../models/work-order.model.js';

class MaintenanceController {
  async create(req, res, next) {
    try {
      const wo = await MaintenanceService.createWorkOrder(req.body, req.user.tenantId, req.user.id);
      res.status(201).json({ success: true, data: wo });
    } catch (err) { next(err); }
  }

  async list(req, res, next) {
    try {
      const orders = await WorkOrderModel.list(req.user.tenantId, {
        status: req.query.status, vehicle_id: req.query.vehicle_id,
        limit: req.query.limit ? parseInt(req.query.limit) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset) : undefined,
      });
      res.json({ success: true, data: orders });
    } catch (err) { next(err); }
  }

  async getById(req, res, next) {
    try {
      const wo = await WorkOrderModel.findById(req.params.id, req.user.tenantId);
      if (!wo) return res.status(404).json({ success: false, error: 'Work order not found' });
      res.json({ success: true, data: wo });
    } catch (err) { next(err); }
  }

  async start(req, res, next) {
    try {
      const wo = await MaintenanceService.startWorkOrder(req.params.id, req.user.tenantId, req.user.id);
      res.json({ success: true, data: wo });
    } catch (err) { next(err); }
  }

  async complete(req, res, next) {
    try {
      const wo = await MaintenanceService.completeWorkOrder(req.params.id, req.user.tenantId, req.body, req.user.id);
      res.json({ success: true, data: wo });
    } catch (err) { next(err); }
  }

  async cancel(req, res, next) {
    try {
      const wo = await MaintenanceService.cancelWorkOrder(req.params.id, req.user.tenantId, req.body.reason, req.user.id);
      res.json({ success: true, data: wo });
    } catch (err) { next(err); }
  }

  async overdueVehicles(req, res, next) {
    try {
      const vehicles = await MaintenanceService.getOverdueVehicles(req.user.tenantId);
      res.json({ success: true, data: vehicles });
    } catch (err) { next(err); }
  }

  async upcoming(req, res, next) {
    try {
      const days = req.query.days ? parseInt(req.query.days) : 30;
      const upcoming = await MaintenanceService.getUpcomingMaintenance(req.user.tenantId, days);
      res.json({ success: true, data: upcoming });
    } catch (err) { next(err); }
  }

  async vehicleSummary(req, res, next) {
    try {
      const summary = await MaintenanceService.getMaintenanceSummary(req.params.vehicleId, req.user.tenantId);
      res.json({ success: true, data: summary });
    } catch (err) { next(err); }
  }
}

export default new MaintenanceController();
