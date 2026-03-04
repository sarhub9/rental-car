import InvoiceService from '../services/invoice.service.js';

class InvoiceController {
  /**
   * Generate invoice for agreement
   * POST /invoices/generate/:agreementId
   */
  async generate(req, res) {
    try {
      const invoice = await InvoiceService.generateInvoice(
        req.params.agreementId,
        req.tenantId,
        req.user.id
      );
      return res.status(201).json({ success: true, data: invoice });
    } catch (error) {
      console.error('Generate invoice error:', error);
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Failed to generate invoice' });
    }
  }

  /**
   * Issue invoice
   * PATCH /invoices/:id/issue
   */
  async issue(req, res) {
    try {
      const invoice = await InvoiceService.issueInvoice(req.params.id, req.tenantId);
      return res.status(200).json({ success: true, data: invoice });
    } catch (error) {
      console.error('Issue invoice error:', error);
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Failed to issue invoice' });
    }
  }

  /**
   * Void invoice
   * PATCH /invoices/:id/void
   */
  async void(req, res) {
    try {
      const { reason } = req.body;
      if (!reason) {
        return res.status(400).json({ error: 'Void reason is required' });
      }
      const invoice = await InvoiceService.voidInvoice(req.params.id, req.tenantId, reason);
      return res.status(200).json({ success: true, data: invoice });
    } catch (error) {
      console.error('Void invoice error:', error);
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Failed to void invoice' });
    }
  }

  /**
   * Get invoice detail
   * GET /invoices/:id
   */
  async getById(req, res) {
    try {
      const invoice = await InvoiceService.getInvoice(req.params.id, req.tenantId);
      return res.status(200).json({ success: true, data: invoice });
    } catch (error) {
      console.error('Get invoice error:', error);
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Failed to retrieve invoice' });
    }
  }

  /**
   * List invoices
   * GET /invoices
   */
  async list(req, res) {
    try {
      const filters = {
        status: req.query.status,
        customer_id: req.query.customer_id,
        limit: parseInt(req.query.limit) || 20,
        offset: parseInt(req.query.offset) || 0,
      };
      const invoices = await InvoiceService.getCustomerInvoices(null, req.tenantId, filters);
      return res.status(200).json({ success: true, data: invoices });
    } catch (error) {
      console.error('List invoices error:', error);
      return res.status(500).json({ error: 'Failed to list invoices' });
    }
  }

  /**
   * Record payment
   * POST /invoices/:id/payments
   */
  async recordPayment(req, res) {
    try {
      const result = await InvoiceService.recordPayment(
        req.params.id,
        req.tenantId,
        req.body,
        req.user.id
      );
      return res.status(201).json({ success: true, data: result });
    } catch (error) {
      console.error('Record payment error:', error);
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Failed to record payment' });
    }
  }

  // ---- Customer Portal Endpoints ----

  /**
   * Get customer's invoices
   * GET /customer/invoices
   */
  async getCustomerInvoices(req, res) {
    try {
      const filters = {
        status: req.query.status,
        limit: parseInt(req.query.limit) || 20,
        offset: parseInt(req.query.offset) || 0,
      };
      const invoices = await InvoiceService.getCustomerInvoices(
        req.user.customerId,
        req.tenantId,
        filters
      );
      return res.status(200).json({ success: true, data: invoices });
    } catch (error) {
      console.error('Get customer invoices error:', error);
      return res.status(500).json({ error: 'Failed to load invoices' });
    }
  }

  /**
   * Get customer invoice detail
   * GET /customer/invoices/:id
   */
  async getCustomerInvoiceDetail(req, res) {
    try {
      const invoice = await InvoiceService.getInvoice(req.params.id, req.tenantId);

      // Ownership check
      if (invoice.customer_id !== req.user.customerId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      return res.status(200).json({ success: true, data: invoice });
    } catch (error) {
      console.error('Get customer invoice detail error:', error);
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Failed to load invoice' });
    }
  }

  /**
   * Get customer's payments
   * GET /customer/payments
   */
  async getCustomerPayments(req, res) {
    try {
      const filters = {
        limit: parseInt(req.query.limit) || 20,
        offset: parseInt(req.query.offset) || 0,
      };
      const payments = await InvoiceService.getCustomerPayments(
        req.user.customerId,
        req.tenantId,
        filters
      );
      return res.status(200).json({ success: true, data: payments });
    } catch (error) {
      console.error('Get customer payments error:', error);
      return res.status(500).json({ error: 'Failed to load payments' });
    }
  }
}

export default new InvoiceController();
