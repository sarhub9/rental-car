import RatePlanModel from '../models/rate-plan.model.js';

class RatePlanService {
  async create(data, tenantId) {
    return await RatePlanModel.create({ ...data, tenant_id: tenantId });
  }

  async getById(id, tenantId) {
    const plan = await RatePlanModel.findById(id, tenantId);
    if (!plan) {
      const err = new Error('Rate plan not found');
      err.statusCode = 404;
      throw err;
    }
    return plan;
  }

  async list(tenantId, filters = {}) {
    return await RatePlanModel.list(tenantId, filters);
  }

  async listValidForDate(tenantId, date) {
    return await RatePlanModel.findValidForDate(tenantId, date);
  }

  async update(id, tenantId, data) {
    await this.getById(id, tenantId);
    return await RatePlanModel.update(id, tenantId, data);
  }

  async setCategoryMappings(id, tenantId, categoryIds) {
    await this.getById(id, tenantId);
    await RatePlanModel.setCategoryMappings(id, categoryIds);
    return await RatePlanModel.getCategoryMappings(id);
  }

  async getCategoryMappings(id, tenantId) {
    await this.getById(id, tenantId);
    return await RatePlanModel.getCategoryMappings(id);
  }

  async deactivate(id, tenantId) {
    await this.getById(id, tenantId);
    return await RatePlanModel.update(id, tenantId, { is_active: false });
  }
}

export default new RatePlanService();
