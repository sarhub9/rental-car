import VehicleDocumentModel from '../models/vehicle-document.model.js';

class VehicleDocumentService {
  async upload(data, tenantId, userId) {
    return await VehicleDocumentModel.create({
      ...data,
      tenant_id: tenantId,
      uploaded_by_user_id: userId,
    });
  }

  async getById(id, tenantId) {
    const doc = await VehicleDocumentModel.findById(id, tenantId);
    if (!doc) {
      const err = new Error('Vehicle document not found');
      err.statusCode = 404;
      throw err;
    }
    return doc;
  }

  async getByVehicle(vehicleId, tenantId) {
    return await VehicleDocumentModel.findByVehicle(vehicleId, tenantId);
  }

  async update(id, tenantId, data) {
    await this.getById(id, tenantId);
    return await VehicleDocumentModel.update(id, tenantId, data);
  }

  async deactivate(id, tenantId) {
    await this.getById(id, tenantId);
    return await VehicleDocumentModel.update(id, tenantId, { is_active: false });
  }

  async getExpiryAlerts(tenantId) {
    const [expiringSoon, expired] = await Promise.all([
      VehicleDocumentModel.getExpiringSoon(tenantId, 30),
      VehicleDocumentModel.getExpired(tenantId),
    ]);
    return { expiring_soon: expiringSoon, expired };
  }
}

export default new VehicleDocumentService();
