import CashDrawerSessionModel from '../models/cash-drawer-session.model.js';

class CashDrawerService {
  async openSession(data, tenantId, userId) {
    // Check no already-open session for same branch today
    const existing = await CashDrawerSessionModel.findOpenSession(tenantId, data.branch_id);
    if (existing) {
      const err = new Error('A cash drawer session is already open for this branch');
      err.statusCode = 409;
      err.session_id = existing.id;
      throw err;
    }

    return await CashDrawerSessionModel.open({
      ...data,
      tenant_id: tenantId,
      opened_by_user_id: userId,
      session_date: data.session_date || new Date().toISOString().split('T')[0],
    });
  }

  async closeSession(id, tenantId, userId, closingBalance, notes) {
    const session = await CashDrawerSessionModel.findById(id, tenantId);
    if (!session) {
      const err = new Error('Session not found');
      err.statusCode = 404;
      throw err;
    }
    if (session.status === 'CLOSED') {
      const err = new Error('Session is already closed');
      err.statusCode = 409;
      throw err;
    }
    return await CashDrawerSessionModel.close(id, tenantId, userId, closingBalance, notes);
  }

  async getSessionSummary(id, tenantId) {
    const session = await CashDrawerSessionModel.findById(id, tenantId);
    if (!session) {
      const err = new Error('Session not found');
      err.statusCode = 404;
      throw err;
    }
    return await CashDrawerSessionModel.getSessionSummary(id, tenantId);
  }

  async getOpenSession(tenantId, branchId = null) {
    return await CashDrawerSessionModel.findOpenSession(tenantId, branchId);
  }

  async list(tenantId, filters = {}) {
    return await CashDrawerSessionModel.list(tenantId, filters);
  }
}

export default new CashDrawerService();
