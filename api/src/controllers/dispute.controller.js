import DisputeService from '../services/dispute.service.js';

class DisputeController {
  // ---- Customer Portal Endpoints ----

  async createDispute(req, res) {
    try {
      const dispute = await DisputeService.createDispute(
        { ...req.body, customer_id: req.user.customerId },
        req.user.id,
        req.tenantId
      );
      return res.status(201).json({ success: true, data: dispute });
    } catch (error) {
      console.error('Create dispute error:', error);
      if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
      return res.status(500).json({ error: 'Failed to create dispute' });
    }
  }

  async getCustomerDisputes(req, res) {
    try {
      const filters = {
        status: req.query.status,
        limit: parseInt(req.query.limit) || 20,
        offset: parseInt(req.query.offset) || 0,
      };
      const disputes = await DisputeService.getCustomerDisputes(
        req.user.customerId, req.tenantId, filters
      );
      return res.status(200).json({ success: true, data: disputes });
    } catch (error) {
      console.error('List disputes error:', error);
      return res.status(500).json({ error: 'Failed to load disputes' });
    }
  }

  async getCustomerDisputeDetail(req, res) {
    try {
      const dispute = await DisputeService.getDispute(req.params.id, req.tenantId);
      if (dispute.customer_id !== req.user.customerId) {
        return res.status(403).json({ error: 'Access denied' });
      }
      return res.status(200).json({ success: true, data: dispute });
    } catch (error) {
      console.error('Get dispute error:', error);
      if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
      return res.status(500).json({ error: 'Failed to load dispute' });
    }
  }

  async addCustomerMessage(req, res) {
    try {
      // Verify ownership
      const dispute = await DisputeService.getDispute(req.params.id, req.tenantId);
      if (dispute.customer_id !== req.user.customerId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const message = await DisputeService.addMessage(
        req.params.id, req.tenantId, req.user.id,
        'RENTAL_CUSTOMER', req.body.message, req.body.attachments
      );
      return res.status(201).json({ success: true, data: message });
    } catch (error) {
      console.error('Add message error:', error);
      if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
      return res.status(500).json({ error: 'Failed to add message' });
    }
  }

  // ---- Admin/Front Desk Endpoints ----

  async listDisputes(req, res) {
    try {
      const filters = {
        status: req.query.status,
        limit: parseInt(req.query.limit) || 20,
        offset: parseInt(req.query.offset) || 0,
      };
      const disputes = await DisputeService.listDisputes(req.tenantId, filters);
      return res.status(200).json({ success: true, data: disputes });
    } catch (error) {
      console.error('List disputes error:', error);
      return res.status(500).json({ error: 'Failed to load disputes' });
    }
  }

  async updateDisputeStatus(req, res) {
    try {
      const { status, resolution_notes } = req.body;
      const dispute = await DisputeService.updateStatus(
        req.params.id, req.tenantId, status, req.user.id, resolution_notes
      );
      return res.status(200).json({ success: true, data: dispute });
    } catch (error) {
      console.error('Update dispute status error:', error);
      if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
      return res.status(500).json({ error: 'Failed to update dispute' });
    }
  }

  async addAdminMessage(req, res) {
    try {
      const message = await DisputeService.addMessage(
        req.params.id, req.tenantId, req.user.id,
        req.user.role, req.body.message, req.body.attachments
      );
      return res.status(201).json({ success: true, data: message });
    } catch (error) {
      console.error('Add admin message error:', error);
      if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
      return res.status(500).json({ error: 'Failed to add message' });
    }
  }
}

export default new DisputeController();
