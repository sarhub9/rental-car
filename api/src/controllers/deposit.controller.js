import DepositService from '../services/deposit.service.js';
import DepositModel from '../models/deposit.model.js';

class DepositController {
  async collect(req, res, next) {
    try {
      const { agreement_id, amount, payment_method, customer_id } = req.body;
      const deposit = await DepositService.collectDeposit(
        agreement_id, req.user.tenantId, amount, payment_method, req.user.id, customer_id
      );
      res.status(201).json({ success: true, data: deposit });
    } catch (err) { next(err); }
  }

  async list(req, res, next) {
    try {
      const deposits = await DepositModel.list(req.user.tenantId, {
        status: req.query.status, customer_id: req.query.customer_id,
        limit: req.query.limit ? parseInt(req.query.limit) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset) : undefined,
      });
      res.json({ success: true, data: deposits });
    } catch (err) { next(err); }
  }

  async getByAgreement(req, res, next) {
    try {
      const deposits = await DepositService.findByAgreementId(req.params.agreementId, req.user.tenantId);
      res.json({ success: true, data: deposits });
    } catch (err) { next(err); }
  }

  async use(req, res, next) {
    try {
      const deposit = await DepositService.useDeposit(
        req.params.id, req.user.tenantId, req.body.amount, req.body.reason, req.user.id
      );
      res.json({ success: true, data: deposit });
    } catch (err) { next(err); }
  }

  async release(req, res, next) {
    try {
      const deposit = await DepositService.releaseDeposit(req.params.id, req.user.tenantId, req.user.id);
      res.json({ success: true, data: deposit });
    } catch (err) { next(err); }
  }

  async forfeit(req, res, next) {
    try {
      const deposit = await DepositService.forfeitDeposit(
        req.params.id, req.user.tenantId, req.body.justification, req.user.id
      );
      res.json({ success: true, data: deposit });
    } catch (err) { next(err); }
  }

  async refund(req, res, next) {
    try {
      const deposit = await DepositService.refundDeposit(req.params.id, req.user.tenantId, req.user.id);
      res.json({ success: true, data: deposit });
    } catch (err) { next(err); }
  }

  async eligible(req, res, next) {
    try {
      const deposits = await DepositService.getDepositsForRelease(req.user.tenantId);
      res.json({ success: true, data: deposits });
    } catch (err) { next(err); }
  }
}

export default new DepositController();
