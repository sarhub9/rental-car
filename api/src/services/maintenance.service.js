import WorkOrderModel from '../models/work-order.model.js';
import AvailabilityService from './availability.service.js';

class MaintenanceService {
  async createWorkOrder(data, tenantId, userId) {
    const woNumber = await WorkOrderModel.generateWorkOrderNumber(tenantId);

    const workOrder = await WorkOrderModel.create({
      tenant_id: tenantId,
      work_order_number: woNumber,
      vehicle_id: data.vehicle_id,
      type: data.type,
      description: data.description,
      estimated_cost: data.estimated_cost,
      scheduled_date: data.scheduled_date,
      next_maintenance_km: data.next_maintenance_km,
      next_maintenance_date: data.next_maintenance_date,
      notes: data.notes,
      created_by_user_id: userId,
    });

    const lockStart = data.scheduled_date ? new Date(data.scheduled_date) : new Date();
    const lockEnd = new Date(lockStart);
    lockEnd.setDate(lockEnd.getDate() + (data.estimated_days || 3));

    try {
      await AvailabilityService.lockVehicle(
        data.vehicle_id, null, tenantId, lockStart, lockEnd, 'maintenance', userId
      );
    } catch (e) {
      console.warn('Maintenance lock failed (vehicle may have conflicting bookings):', e.message);
    }

    try {
      const VehicleModel = (await import('../models/vehicle.model.js')).default;
      await VehicleModel.update(data.vehicle_id, tenantId, { status: 'MAINTENANCE' });
    } catch (e) {
      console.warn('Vehicle status update failed:', e.message);
    }

    try {
      const AuditLogService = (await import('./audit-log.service.js')).default;
      await AuditLogService.logSystemEvent({
        tenantId, userId,
        action: 'work_order_created', entityType: 'work_order', entityId: workOrder.id,
        newValue: { work_order_number: woNumber, vehicle_id: data.vehicle_id, type: data.type },
      });
    } catch (e) { /* non-blocking */ }

    return workOrder;
  }

  async startWorkOrder(workOrderId, tenantId, userId) {
    const wo = await WorkOrderModel.updateStatus(workOrderId, tenantId, 'in_progress', {
      started_at: new Date(),
    });

    try {
      const AuditLogService = (await import('./audit-log.service.js')).default;
      await AuditLogService.logSystemEvent({
        tenantId, userId,
        action: 'work_order_started', entityType: 'work_order', entityId: workOrderId,
        oldValue: { status: 'open' }, newValue: { status: 'in_progress' },
      });
    } catch (e) { /* non-blocking */ }

    return wo;
  }

  async completeWorkOrder(workOrderId, tenantId, data, userId) {
    const existing = await WorkOrderModel.findById(workOrderId, tenantId);
    if (!existing) throw Object.assign(new Error('Work order not found'), { statusCode: 404 });

    const completedAt = new Date();
    const startedAt = existing.started_at || existing.created_at;
    const downtimeDays = Math.max(1, Math.ceil((completedAt - new Date(startedAt)) / (1000 * 60 * 60 * 24)));

    const wo = await WorkOrderModel.updateStatus(workOrderId, tenantId, 'completed', {
      actual_cost: data.actual_cost,
      completed_at: completedAt,
      completed_by_user_id: userId,
      downtime_days: downtimeDays,
      next_maintenance_km: data.next_maintenance_km,
      next_maintenance_date: data.next_maintenance_date,
      notes: data.notes,
    });

    try {
      const VehicleModel = (await import('../models/vehicle.model.js')).default;
      await VehicleModel.update(existing.vehicle_id, tenantId, { status: 'AVAILABLE' });
    } catch (e) {
      console.warn('Vehicle status restore failed:', e.message);
    }

    try {
      const AuditLogService = (await import('./audit-log.service.js')).default;
      await AuditLogService.logSystemEvent({
        tenantId, userId,
        action: 'work_order_completed', entityType: 'work_order', entityId: workOrderId,
        oldValue: { status: existing.status },
        newValue: { status: 'completed', actual_cost: data.actual_cost, downtime_days: downtimeDays },
      });
    } catch (e) { /* non-blocking */ }

    return wo;
  }

  async cancelWorkOrder(workOrderId, tenantId, reason, userId) {
    const existing = await WorkOrderModel.findById(workOrderId, tenantId);
    if (!existing) throw Object.assign(new Error('Work order not found'), { statusCode: 404 });

    const wo = await WorkOrderModel.updateStatus(workOrderId, tenantId, 'cancelled', { notes: reason });

    try {
      const VehicleModel = (await import('../models/vehicle.model.js')).default;
      await VehicleModel.update(existing.vehicle_id, tenantId, { status: 'AVAILABLE' });
    } catch (e) { /* non-blocking */ }

    return wo;
  }

  async getOverdueVehicles(tenantId) {
    return WorkOrderModel.getOverdueVehicles(tenantId);
  }

  async getMaintenanceSummary(vehicleId, tenantId) {
    const orders = await WorkOrderModel.findByVehicleId(vehicleId, tenantId);
    const completed = orders.filter(o => o.status === 'completed');
    const totalCost = completed.reduce((sum, o) => sum + parseFloat(o.actual_cost || 0), 0);
    const totalDowntime = completed.reduce((sum, o) => sum + (o.downtime_days || 0), 0);
    return { total_orders: orders.length, completed: completed.length, total_cost: totalCost, total_downtime_days: totalDowntime, history: orders };
  }

  async getUpcomingMaintenance(tenantId, daysAhead = 30) {
    return WorkOrderModel.getUpcoming(tenantId, daysAhead);
  }
}

export default new MaintenanceService();
