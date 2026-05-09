import CashDrawerService from '../services/cash-drawer.service.js';

class CashDrawerController {
  async openSession(req, res) {
    try {
      const session = await CashDrawerService.openSession(req.body, req.tenantId, req.user.id);
      return res.status(201).json({ success: true, data: session });
    } catch (error) {
      if (error.statusCode) return res.status(error.statusCode).json({ error: error.message, session_id: error.session_id });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async closeSession(req, res) {
    try {
      const session = await CashDrawerService.closeSession(
        req.params.id, req.tenantId, req.user.id,
        req.body.closing_balance, req.body.notes
      );
      return res.status(200).json({ success: true, data: session });
    } catch (error) {
      if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async getSessionSummary(req, res) {
    try {
      const summary = await CashDrawerService.getSessionSummary(req.params.id, req.tenantId);
      return res.status(200).json({ success: true, data: summary });
    } catch (error) {
      if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async getOpenSession(req, res) {
    try {
      const session = await CashDrawerService.getOpenSession(req.tenantId, req.query.branch_id);
      return res.status(200).json({ success: true, data: session || null });
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async list(req, res) {
    try {
      const filters = {
        status: req.query.status,
        branch_id: req.query.branch_id,
        session_date: req.query.session_date,
        limit: parseInt(req.query.limit) || 20,
        offset: parseInt(req.query.offset) || 0,
      };
      const sessions = await CashDrawerService.list(req.tenantId, filters);
      return res.status(200).json({ success: true, data: sessions });
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

export default new CashDrawerController();
