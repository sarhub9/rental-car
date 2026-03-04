import TollFineService from '../services/toll-fine.service.js';
import TollFineEventModel from '../models/toll-fine-event.model.js';

class TollFineController {
  async importCsv(req, res, next) {
    try {
      const rows = req.body.events || req.body;
      if (!Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({ success: false, error: 'No events provided' });
      }
      const result = await TollFineService.importFromCsv(rows, req.user.tenantId, req.user.id);
      res.status(201).json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async list(req, res, next) {
    try {
      const events = await TollFineEventModel.list(req.user.tenantId, {
        attribution_status: req.query.status,
        plate_number: req.query.plate,
        agreement_id: req.query.agreement_id,
        limit: req.query.limit ? parseInt(req.query.limit) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset) : undefined,
      });
      res.json({ success: true, data: events });
    } catch (err) { next(err); }
  }

  async getUnmatched(req, res, next) {
    try {
      const events = await TollFineService.getUnmatchedQueue(req.user.tenantId, {
        limit: req.query.limit ? parseInt(req.query.limit) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset) : undefined,
      });
      res.json({ success: true, data: events });
    } catch (err) { next(err); }
  }

  async manualAssign(req, res, next) {
    try {
      const result = await TollFineService.manualAttribute(
        req.params.id, req.body.agreement_id, req.user.tenantId, req.user.id
      );
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async getByAgreement(req, res, next) {
    try {
      const events = await TollFineEventModel.findByAgreementId(req.params.agreementId, req.user.tenantId);
      res.json({ success: true, data: events });
    } catch (err) { next(err); }
  }

  async reprocess(req, res, next) {
    try {
      const result = await TollFineService.reprocessPending(req.user.tenantId);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }
}

export default new TollFineController();
