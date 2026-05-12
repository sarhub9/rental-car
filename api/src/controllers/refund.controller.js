import RefundService from '../services/refund.service.js';

class RefundController {
  async request(req, res) {
    try {
      const refund = await RefundService.request(req.body, req.tenantId, req.user.id);
      return res.status(201).json({ success: true, data: refund });
    } catch (error) {
      if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
      // PostgreSQL invalid UUID format
      if (error.code === '22P02') return res.status(400).json({ error: 'Invalid UUID format for one of the ID fields' });
      // PostgreSQL foreign key violation
      if (error.code === '23503') return res.status(400).json({ error: 'Referenced payment, customer or invoice does not exist' });
      // PostgreSQL not null violation
      if (error.code === '23502') return res.status(400).json({ error: `Missing required field: ${error.column}` });
      console.error('Refund request error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async list(req, res) {
    try {
      const filters = {
        status: req.query.status,
        customer_id: req.query.customer_id,
        limit: parseInt(req.query.limit) || 20,
        offset: parseInt(req.query.offset) || 0,
      };
      const refunds = await RefundService.list(req.tenantId, filters);
      return res.status(200).json({ success: true, data: refunds });
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async getById(req, res) {
    try {
      const refund = await RefundService.getById(req.params.id, req.tenantId);
      return res.status(200).json({ success: true, data: refund });
    } catch (error) {
      if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async approve(req, res) {
    try {
      const refund = await RefundService.approve(req.params.id, req.tenantId, req.user.id);
      return res.status(200).json({ success: true, data: refund });
    } catch (error) {
      if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async reject(req, res) {
    try {
      const refund = await RefundService.reject(req.params.id, req.tenantId, req.user.id, req.body.reason);
      return res.status(200).json({ success: true, data: refund });
    } catch (error) {
      if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async process(req, res) {
    try {
      const refund = await RefundService.process(req.params.id, req.tenantId, req.body.refund_method, req.body.transaction_reference);
      return res.status(200).json({ success: true, data: refund });
    } catch (error) {
      if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

export default new RefundController();
