import CorporateAccountModel from '../models/corporate-account.model.js';

class CorporateAccountService {
  async create(data, tenantId, userId) {
    const accountNumber = await CorporateAccountModel.generateAccountNumber(tenantId);
    return await CorporateAccountModel.create({
      ...data,
      tenant_id: tenantId,
      account_number: accountNumber,
      created_by_user_id: userId,
    });
  }

  async getById(id, tenantId) {
    const account = await CorporateAccountModel.findById(id, tenantId);
    if (!account) {
      const err = new Error('Corporate account not found');
      err.statusCode = 404;
      throw err;
    }
    return account;
  }

  async list(tenantId, filters = {}) {
    return await CorporateAccountModel.list(tenantId, filters);
  }

  async update(id, tenantId, data) {
    await this.getById(id, tenantId);
    return await CorporateAccountModel.update(id, tenantId, data);
  }

  async checkCreditAvailable(id, tenantId, requiredAmount) {
    const account = await this.getById(id, tenantId);
    const available = parseFloat(account.credit_limit) - parseFloat(account.credit_used);
    if (available < requiredAmount) {
      const err = new Error(`Insufficient credit. Available: ${available.toFixed(2)}, Required: ${requiredAmount}`);
      err.statusCode = 422;
      err.available = available;
      err.required = requiredAmount;
      throw err;
    }
    return { available, required: requiredAmount };
  }

  async getARAgingReport(tenantId) {
    return await CorporateAccountModel.getARAgingReport(tenantId);
  }
}

export default new CorporateAccountService();
