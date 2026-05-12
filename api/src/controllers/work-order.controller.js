import WorkOrderService from '../services/work-order.service.js';
import MaintenanceSchedulerService from '../services/maintenance-scheduler.service.js';

class WorkOrderController {
  async create(req, res) {
    try {
      const wo = await WorkOrderService.create(req.body, req.tenantId, req.user.id);
      return res.status(201).json({ success: true, data: wo });
    } catch (error) {
      if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
      if (error.code === '22P02') return res.status(400).json({ error: 'Invalid UUID format for vehicle_id' });
      if (error.code === '23503') return res.status(400).json({ error: 'Vehicle not found — check the vehicle ID' });
      if (error.code === '23502') return res.status(400).json({ error: `Missing required field: ${error.column}` });
      console.error('Work order create error:', error);
      return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  }

  async list(req, res) {
    try {
      const filters = {
        status: req.query.status,
        vehicle_id: req.query.vehicle_id,
        limit: parseInt(req.query.limit) || 20,
        offset: parseInt(req.query.offset) || 0,
      };
      const orders = await WorkOrderService.list(req.tenantId, filters);
      return res.status(200).json({ success: true, data: orders });
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async getById(req, res) {
    try {
      const [wo, lineItems] = await Promise.all([
        WorkOrderService.getById(req.params.id, req.tenantId),
        WorkOrderService.getLineItems(req.params.id, req.tenantId),
      ]);
      return res.status(200).json({ success: true, data: { ...wo, line_items: lineItems } });
    } catch (error) {
      if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async update(req, res) {
    try {
      const wo = await WorkOrderService.update(req.params.id, req.tenantId, req.body);
      return res.status(200).json({ success: true, data: wo });
    } catch (error) {
      if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async addLineItem(req, res) {
    try {
      const item = await WorkOrderService.addLineItem(req.params.id, req.tenantId, req.body);
      return res.status(201).json({ success: true, data: item });
    } catch (error) {
      if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async getDueSoon(req, res) {
    try {
      const withinDays = parseInt(req.query.within_days) || 14;
      const schedules = await MaintenanceSchedulerService.getDueSoon(req.tenantId, withinDays);
      return res.status(200).json({ success: true, data: schedules });
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async createSchedule(req, res) {
    try {
      const schedule = await WorkOrderService.createSchedule(req.body, req.tenantId);
      return res.status(201).json({ success: true, data: schedule });
    } catch (error) {
      if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async getVehicleCostStats(req, res) {
    try {
      const stats = await WorkOrderService.getVehicleCostStats(req.tenantId, req.params.vehicleId);
      return res.status(200).json({ success: true, data: stats });
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

export default new WorkOrderController();
