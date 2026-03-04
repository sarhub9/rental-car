import VehicleModel from '../models/vehicle.model.js';

class VehicleService {
  async create(data) {
    const vehicleNumber = await VehicleModel.generateVehicleNumber(data.tenant_id);
    data.vehicle_number = vehicleNumber;
    return VehicleModel.create(data);
  }

  async getById(id, tenantId) {
    const vehicle = await VehicleModel.findById(id, tenantId);
    if (!vehicle) throw new Error('Vehicle not found');
    return vehicle;
  }

  async list(tenantId, filters) {
    return VehicleModel.list(tenantId, filters);
  }

  async update(id, tenantId, data) {
    const vehicle = await VehicleModel.update(id, tenantId, data);
    if (!vehicle) throw new Error('Vehicle not found');
    return vehicle;
  }

  async searchAvailable(tenantId, startDate, endDate) {
    if (!startDate || !endDate) {
      throw new Error('Start date and end date are required');
    }
    if (new Date(startDate) >= new Date(endDate)) {
      throw new Error('End date must be after start date');
    }
    return VehicleModel.searchAvailable(tenantId, startDate, endDate);
  }

  validateVehicleForRental(vehicle) {
    if (vehicle.status !== 'AVAILABLE') {
      throw new Error(`Vehicle is not available (current status: ${vehicle.status})`);
    }
    if (vehicle.registration_expiry && new Date(vehicle.registration_expiry) < new Date()) {
      throw new Error('Vehicle registration has expired');
    }
    if (vehicle.insurance_expiry && new Date(vehicle.insurance_expiry) < new Date()) {
      throw new Error('Vehicle insurance has expired');
    }
  }
}

export default new VehicleService();
