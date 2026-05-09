import WorkOrderModel from '../models/work-order.model.js';

class MaintenanceSchedulerService {
  /**
   * Check all vehicles and auto-create work orders for overdue maintenance
   */
  async runDueChecks(tenantId) {
    const dueSoon = await WorkOrderModel.getDueSoonSchedules(tenantId, 0); // only overdue
    const created = [];

    for (const schedule of dueSoon) {
      // Check if WO already exists for this schedule
      const existing = await WorkOrderModel.list(tenantId, {
        vehicle_id: schedule.vehicle_id,
        status: 'OPEN',
      });

      const alreadyOpen = existing.some(wo => wo.maintenance_type === schedule.maintenance_type);
      if (alreadyOpen) continue;

      const woNumber = await WorkOrderModel.generateWorkOrderNumber(tenantId);
      const wo = await WorkOrderModel.create({
        tenant_id: tenantId,
        work_order_number: woNumber,
        vehicle_id: schedule.vehicle_id,
        maintenance_type: schedule.maintenance_type,
        description: `Auto-scheduled: ${schedule.maintenance_type}`,
        blocks_rental: false,
        created_by_user_id: null, // system-generated
      });
      created.push(wo);
    }

    return created;
  }

  async getDueSoon(tenantId, withinDays = 14) {
    return await WorkOrderModel.getDueSoonSchedules(tenantId, withinDays);
  }

  async getSchedulesByVehicle(tenantId, vehicleId) {
    const result = await WorkOrderModel.getDueSoonSchedules(tenantId, 9999);
    return result.filter(s => s.vehicle_id === vehicleId);
  }
}

export default new MaintenanceSchedulerService();
