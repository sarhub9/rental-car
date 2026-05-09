import IncidentModel from '../models/incident.model.js';

class IncidentService {
  async create(data, tenantId, userId) {
    const incidentNumber = await IncidentModel.generateIncidentNumber(tenantId);
    return await IncidentModel.create({
      ...data,
      tenant_id: tenantId,
      incident_number: incidentNumber,
      created_by_user_id: userId,
    });
  }

  async getById(id, tenantId) {
    const incident = await IncidentModel.findById(id, tenantId);
    if (!incident) {
      const err = new Error('Incident not found');
      err.statusCode = 404;
      throw err;
    }
    return incident;
  }

  async list(tenantId, filters = {}) {
    return await IncidentModel.list(tenantId, filters);
  }

  async update(id, tenantId, data) {
    const incident = await this.getById(id, tenantId);
    if (['CLOSED', 'SETTLED'].includes(incident.status) && !data.status) {
      const err = new Error('Closed/Settled incidents cannot be modified');
      err.statusCode = 409;
      throw err;
    }
    if (data.status === 'SETTLED') {
      data.settled_at = new Date().toISOString();
    }
    return await IncidentModel.update(id, tenantId, data);
  }

  async addPhoto(incidentId, tenantId, photoData, userId) {
    await this.getById(incidentId, tenantId);
    return await IncidentModel.addPhoto({
      ...photoData,
      tenant_id: tenantId,
      incident_id: incidentId,
      uploaded_by_user_id: userId,
    });
  }

  async getPhotos(incidentId, tenantId) {
    await this.getById(incidentId, tenantId);
    return await IncidentModel.getPhotos(incidentId, tenantId);
  }

  async getDetail(incidentId, tenantId) {
    const [incident, photos] = await Promise.all([
      this.getById(incidentId, tenantId),
      IncidentModel.getPhotos(incidentId, tenantId),
    ]);
    return { ...incident, photos };
  }
}

export default new IncidentService();
