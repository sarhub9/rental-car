import RefundRequestModel from '../models/refund-request.model.js';
import TenantRulesModel from '../models/tenant-rules.model.js';

class RefundService {
  async request(data, tenantId, userId) {
    const rules = await TenantRulesModel.findByTenantId(tenantId);
    const threshold = rules ? parseFloat(rules.refund_approval_threshold || 500) : 500;

    const refundNumber = await RefundRequestModel.generateRefundNumber(tenantId);

    // Determine initial status — auto-approve if under threshold
    const status = parseFloat(data.amount) <= threshold ? 'APPROVED' : 'PENDING';

    const refund = await RefundRequestModel.create({
      ...data,
      tenant_id: tenantId,
      refund_number: refundNumber,
      requested_by_user_id: userId,
    });

    if (status === 'APPROVED') {
      return await RefundRequestModel.approve(refund.id, tenantId, userId);
    }

    return refund;
  }

  async getById(id, tenantId) {
    const refund = await RefundRequestModel.findById(id, tenantId);
    if (!refund) {
      const err = new Error('Refund request not found');
      err.statusCode = 404;
      throw err;
    }
    return refund;
  }

  async list(tenantId, filters = {}) {
    return await RefundRequestModel.list(tenantId, filters);
  }

  async approve(id, tenantId, approvedByUserId) {
    const refund = await this.getById(id, tenantId);
    if (refund.status !== 'PENDING') {
      const err = new Error(`Refund is already ${refund.status}`);
      err.statusCode = 409;
      throw err;
    }
    return await RefundRequestModel.approve(id, tenantId, approvedByUserId);
  }

  async reject(id, tenantId, approvedByUserId, reason) {
    const refund = await this.getById(id, tenantId);
    if (refund.status !== 'PENDING') {
      const err = new Error(`Refund is already ${refund.status}`);
      err.statusCode = 409;
      throw err;
    }
    return await RefundRequestModel.reject(id, tenantId, approvedByUserId, reason);
  }

  async process(id, tenantId, refundMethod, transactionReference) {
    const refund = await this.getById(id, tenantId);
    if (refund.status !== 'APPROVED') {
      const err = new Error('Only approved refunds can be processed');
      err.statusCode = 409;
      throw err;
    }
    return await RefundRequestModel.process(id, tenantId, refundMethod, transactionReference);
  }
}

export default new RefundService();
