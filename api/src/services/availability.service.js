import VehicleAvailabilityModel from '../models/vehicle-availability.model.js';

class AvailabilityService {
  async lockVehicle(vehicleId, agreementId, tenantId, startDate, endDate, lockType, userId) {
    const conflicts = await this.checkAvailability(vehicleId, tenantId, startDate, endDate, agreementId);

    if (conflicts.length > 0) {
      const error = new Error(
        `Vehicle unavailable: conflict with Agreement #${conflicts[0].agreement_number || 'N/A'} ` +
        `(${new Date(conflicts[0].lock_start).toLocaleDateString()} – ${new Date(conflicts[0].lock_end).toLocaleDateString()})`
      );
      error.statusCode = 409;
      error.conflicts = conflicts;
      throw error;
    }

    try {
      const lock = await VehicleAvailabilityModel.createLock({
        tenant_id: tenantId,
        vehicle_id: vehicleId,
        agreement_id: agreementId,
        lock_start: startDate,
        lock_end: endDate,
        lock_type: lockType,
        created_by_user_id: userId,
      });

      try {
        const AuditLogService = (await import('./audit-log.service.js')).default;
        await AuditLogService.logSystemEvent({
          tenantId, userId,
          action: 'vehicle_locked',
          entityType: 'vehicle_availability',
          entityId: lock.id,
          newValue: { vehicle_id: vehicleId, agreement_id: agreementId, lock_type: lockType, lock_start: startDate, lock_end: endDate },
        });
      } catch (e) { /* audit log failure should not block operations */ }

      return lock;
    } catch (err) {
      if (err.code === '23P01') {
        const error = new Error('Vehicle unavailable: overlapping booking detected');
        error.statusCode = 409;
        throw error;
      }
      throw err;
    }
  }

  async releaseVehicleLock(agreementId, tenantId, userId) {
    const released = await VehicleAvailabilityModel.releaseLock(agreementId, tenantId);

    if (released.length > 0) {
      try {
        const AuditLogService = (await import('./audit-log.service.js')).default;
        await AuditLogService.logSystemEvent({
          tenantId, userId,
          action: 'vehicle_unlocked',
          entityType: 'vehicle_availability',
          entityId: released[0].id,
          oldValue: { vehicle_id: released[0].vehicle_id, agreement_id: agreementId },
        });
      } catch (e) { /* audit log failure should not block operations */ }
    }

    return released;
  }

  async checkAvailability(vehicleId, tenantId, startDate, endDate, excludeAgreementId = null) {
    try {
      return await VehicleAvailabilityModel.findConflicts(vehicleId, tenantId, startDate, endDate, excludeAgreementId);
    } catch (err) {
      if (err.message?.includes('vehicle_availability') || err.code === '42P01') {
        return [];
      }
      throw err;
    }
  }

  async isVehicleBookable(vehicleId, tenantId, startDate, endDate) {
    try {
      const conflicts = await this.checkAvailability(vehicleId, tenantId, startDate, endDate);
      if (conflicts.length > 0) {
        return { bookable: false, reason: 'Vehicle has conflicting bookings', conflicts };
      }
    } catch (e) {
      console.warn('Availability check failed, allowing booking:', e.message);
    }

    try {
      const VehicleModel = (await import('../models/vehicle.model.js')).default;
      const vehicle = await VehicleModel.findById(vehicleId, tenantId);
      if (!vehicle) {
        return { bookable: false, reason: 'Vehicle not found' };
      }
      if (vehicle.status === 'MAINTENANCE' || vehicle.status === 'OUT_OF_SERVICE') {
        return { bookable: false, reason: `Vehicle status: ${vehicle.status}` };
      }

      const maintenanceStatus = await this.checkMaintenanceOverdue(vehicleId, tenantId);
      if (maintenanceStatus.overdue) {
        return { bookable: false, reason: 'Maintenance overdue', details: maintenanceStatus };
      }
    } catch (e) {
      console.warn('Vehicle/maintenance check failed, allowing booking:', e.message);
    }

    return { bookable: true };
  }

  async checkMaintenanceOverdue(vehicleId, tenantId) {
    try {
      const WorkOrderModel = (await import('../models/work-order.model.js')).default;
      const overdue = await WorkOrderModel.isVehicleOverdue(vehicleId, tenantId);
      return overdue;
    } catch (e) {
      return { overdue: false };
    }
  }
}

export default new AvailabilityService();
