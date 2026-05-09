import BranchModel from '../models/branch.model.js';

class BranchService {
  async create(data, tenantId) {
    const existing = await BranchModel.findByCode(data.branch_code, tenantId);
    if (existing) {
      const err = new Error(`Branch code '${data.branch_code}' already exists`);
      err.statusCode = 409;
      throw err;
    }
    return await BranchModel.create({ ...data, tenant_id: tenantId });
  }

  async getById(id, tenantId) {
    const branch = await BranchModel.findById(id, tenantId);
    if (!branch) {
      const err = new Error('Branch not found');
      err.statusCode = 404;
      throw err;
    }
    return branch;
  }

  async list(tenantId, filters = {}) {
    return await BranchModel.list(tenantId, filters);
  }

  async update(id, tenantId, data) {
    const branch = await this.getById(id, tenantId);
    if (!branch) throw Object.assign(new Error('Branch not found'), { statusCode: 404 });

    if (data.branch_code && data.branch_code !== branch.branch_code) {
      const existing = await BranchModel.findByCode(data.branch_code, tenantId);
      if (existing) {
        const err = new Error(`Branch code '${data.branch_code}' already exists`);
        err.statusCode = 409;
        throw err;
      }
    }

    return await BranchModel.update(id, tenantId, data);
  }

  async deactivate(id, tenantId) {
    return await BranchModel.update(id, tenantId, { is_active: false });
  }
}

export default new BranchService();
