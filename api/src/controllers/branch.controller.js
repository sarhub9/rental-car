import BranchService from '../services/branch.service.js';

class BranchController {
  async create(req, res) {
    try {
      const branch = await BranchService.create(req.body, req.tenantId);
      return res.status(201).json({ success: true, data: branch });
    } catch (error) {
      if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async list(req, res) {
    try {
      const filters = { is_active: req.query.is_active !== undefined ? req.query.is_active === 'true' : undefined };
      const branches = await BranchService.list(req.tenantId, filters);
      return res.status(200).json({ success: true, data: branches });
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async getById(req, res) {
    try {
      const branch = await BranchService.getById(req.params.id, req.tenantId);
      return res.status(200).json({ success: true, data: branch });
    } catch (error) {
      if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async update(req, res) {
    try {
      const branch = await BranchService.update(req.params.id, req.tenantId, req.body);
      return res.status(200).json({ success: true, data: branch });
    } catch (error) {
      if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async deactivate(req, res) {
    try {
      const branch = await BranchService.deactivate(req.params.id, req.tenantId);
      return res.status(200).json({ success: true, data: branch });
    } catch (error) {
      if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

export default new BranchController();
