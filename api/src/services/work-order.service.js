import WorkOrderModel from '../models/work-order.model.js';

class WorkOrderService {
  async create(data, tenantId, userId) {
    const woNumber = await WorkOrderModel.generateWorkOrderNumber(tenantId);
    const workOrder = await WorkOrderModel.create({
      ...data,
      tenant_id: tenantId,
      work_order_number: woNumber,
      created_by_user_id: userId,
    });

    // If blocks_rental, the vehicle.service should enforce this during availability checks
    return workOrder;
  }

  async getById(id, tenantId) {
    const wo = await WorkOrderModel.findById(id, tenantId);
    if (!wo) {
      const err = new Error('Work order not found');
      err.statusCode = 404;
      throw err;
    }
    return wo;
  }

  async list(tenantId, filters = {}) {
    return await WorkOrderModel.list(tenantId, filters);
  }

  async update(id, tenantId, data) {
    const wo = await this.getById(id, tenantId);
    if (['COMPLETE', 'CANCELLED'].includes(wo.status) && !data.status) {
      const err = new Error('Completed/Cancelled work orders cannot be modified');
      err.statusCode = 409;
      throw err;
    }

    // Auto-set timestamps
    if (data.status === 'IN_PROGRESS' && !wo.started_at) {
      data.started_at = new Date().toISOString();
    }
    if (data.status === 'COMPLETE' && !wo.completed_at) {
      data.completed_at = new Date().toISOString();
    }

    return await WorkOrderModel.update(id, tenantId, data);
  }

  async addLineItem(workOrderId, tenantId, itemData) {
    await this.getById(workOrderId, tenantId);
    const amount = parseFloat(itemData.quantity) * parseFloat(itemData.unit_price);
    return await WorkOrderModel.addLineItem({
      ...itemData,
      work_order_id: workOrderId,
      amount,
    });
  }

  async getLineItems(workOrderId, tenantId) {
    await this.getById(workOrderId, tenantId);
    return await WorkOrderModel.getLineItems(workOrderId);
  }

  async isVehicleBlocked(tenantId, vehicleId) {
    const blocking = await WorkOrderModel.getActiveBlockingOrders(tenantId, vehicleId);
    return blocking.length > 0 ? blocking : false;
  }

  // Maintenance schedules
  async createSchedule(data, tenantId) {
    return await WorkOrderModel.createSchedule({ ...data, tenant_id: tenantId });
  }

  async getDueSoonSchedules(tenantId, withinDays = 14) {
    return await WorkOrderModel.getDueSoonSchedules(tenantId, withinDays);
  }

  async updateScheduleAfterCompletion(scheduleId, odometer, completionDate) {
    return await WorkOrderModel.updateScheduleAfterWO(scheduleId, odometer, completionDate);
  }

  async getVehicleCostStats(tenantId, vehicleId) {
    const orders = await WorkOrderModel.list(tenantId, { vehicle_id: vehicleId, status: 'COMPLETE' });
    const totalCost = orders.reduce((sum, wo) => sum + parseFloat(wo.actual_cost || wo.estimated_cost || 0), 0);
    const totalKm = orders.reduce((sum, wo) => {
      if (wo.odometer_in && wo.odometer_out) return sum + (wo.odometer_out - wo.odometer_in);
      return sum;
    }, 0);
    return {
      total_maintenance_cost: parseFloat(totalCost.toFixed(2)),
      total_km_in_maintenance: totalKm,
      cost_per_km: totalKm > 0 ? parseFloat((totalCost / totalKm).toFixed(4)) : null,
      work_order_count: orders.length,
    };
  }
}

export default new WorkOrderService();
