import CorporateAccountService from '../services/corporate-account.service.js';

class CorporateAccountController {
  async create(req, res) {
    try {
      const account = await CorporateAccountService.create(req.body, req.tenantId, req.user.id);
      return res.status(201).json({ success: true, data: account });
    } catch (error) {
      if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
      if (error.code === '23505') return res.status(409).json({ error: 'A corporate account with this name or account number already exists' });
      if (error.code === '23502') return res.status(400).json({ error: `Missing required field: ${error.column}` });
      if (error.code === '42P01') return res.status(500).json({ error: 'Database table not found — please run migrations' });
      console.error('Corporate account create error:', error);
      return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  }

  async list(req, res) {
    try {
      const filters = {
        is_active: req.query.is_active !== undefined ? req.query.is_active === 'true' : undefined,
        limit: parseInt(req.query.limit) || 20,
        offset: parseInt(req.query.offset) || 0,
      };
      const accounts = await CorporateAccountService.list(req.tenantId, filters);
      return res.status(200).json({ success: true, data: accounts, pagination: { limit: filters.limit, offset: filters.offset } });
    } catch (error) {
      if (error.code === '42P01') return res.status(500).json({ error: 'Database table not found — please run migrations' });
      console.error('Corporate account list error:', error);
      return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  }

  async getById(req, res) {
    try {
      const account = await CorporateAccountService.getById(req.params.id, req.tenantId);
      return res.status(200).json({ success: true, data: account });
    } catch (error) {
      if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async update(req, res) {
    try {
      const account = await CorporateAccountService.update(req.params.id, req.tenantId, req.body);
      return res.status(200).json({ success: true, data: account });
    } catch (error) {
      if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async getARAgingReport(req, res) {
    try {
      const report = await CorporateAccountService.getARAgingReport(req.tenantId);
      return res.status(200).json({ success: true, data: report });
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

export default new CorporateAccountController();
