import CustomerService from '../services/customer.service.js';

class CustomerController {
  async create(req, res) {
    try {
      const data = {
        ...req.validatedBody,
        tenant_id: req.tenantId,
        created_by_user_id: req.user.id,
      };

      const customer = await CustomerService.create(data);

      return res.status(201).json({
        success: true,
        data: customer,
      });
    } catch (error) {
      console.error('Create customer error:', error);
      const status = error.message.includes('expired') || error.message.includes('duplicate')
        ? 400 : 500;
      return res.status(status).json({
        error: status === 400 ? 'Validation Error' : 'Internal Server Error',
        message: error.message,
      });
    }
  }

  async getById(req, res) {
    try {
      const customer = await CustomerService.getById(req.params.id, req.tenantId);
      return res.status(200).json({ success: true, data: customer });
    } catch (error) {
      const status = error.message === 'Customer not found' ? 404 : 500;
      return res.status(status).json({
        error: status === 404 ? 'Not Found' : 'Internal Server Error',
        message: error.message,
      });
    }
  }

  async list(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 15;
      const page = parseInt(req.query.page) || 1;
      const offset = req.query.offset ? parseInt(req.query.offset) : (page - 1) * limit;

      const filters = {
        is_active: req.query.is_active !== undefined ? req.query.is_active === 'true' : undefined,
        customer_type: req.query.customer_type || undefined,
        limit,
        offset,
      };

      const customers = await CustomerService.list(req.tenantId, filters);
      return res.status(200).json({
        success: true,
        data: customers,
        total: customers.length,
        page,
        limit,
        pages: 1,
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to list customers',
      });
    }
  }

  async search(req, res) {
    try {
      const { q } = req.query;
      const customers = await CustomerService.search(req.tenantId, q);
      return res.status(200).json({ success: true, data: customers });
    } catch (error) {
      const status = error.message.includes('at least') ? 400 : 500;
      return res.status(status).json({
        error: status === 400 ? 'Validation Error' : 'Internal Server Error',
        message: error.message,
      });
    }
  }

  async update(req, res) {
    try {
      const customer = await CustomerService.update(req.params.id, req.tenantId, req.validatedBody);
      return res.status(200).json({ success: true, data: customer });
    } catch (error) {
      const status = error.message === 'Customer not found' ? 404
        : error.message.includes('expired') ? 400 : 500;
      return res.status(status).json({
        error: status === 404 ? 'Not Found' : status === 400 ? 'Validation Error' : 'Internal Server Error',
        message: error.message,
      });
    }
  }
}

export default new CustomerController();
