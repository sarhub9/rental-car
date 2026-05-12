import PaymentModel from '../models/payment.model.js';

class PaymentController {
  async list(req, res) {
    try {
      const { customer_id } = req.query;
      if (!customer_id) return res.status(400).json({ error: 'customer_id query param is required' });
      const payments = await PaymentModel.listByCustomer(customer_id, req.tenantId, {
        limit: parseInt(req.query.limit) || 50,
      });
      return res.status(200).json({ success: true, data: payments });
    } catch (error) {
      console.error('Payment list error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

export default new PaymentController();
