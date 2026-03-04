import RatePlanModel from '../models/rate-plan.model.js';

class RatePlanController {
  async create(req, res, next) {
    try {
      const plan = await RatePlanModel.create({
        tenant_id: req.user.tenantId,
        ...req.body,
      });
      res.status(201).json({ success: true, data: plan });
    } catch (err) { next(err); }
  }

  async list(req, res, next) {
    try {
      const plans = await RatePlanModel.list(req.user.tenantId, {
        is_active: req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined,
        limit: req.query.limit ? parseInt(req.query.limit) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset) : undefined,
      });
      res.json({ success: true, data: plans });
    } catch (err) { next(err); }
  }

  async getById(req, res, next) {
    try {
      const plan = await RatePlanModel.findById(req.params.id, req.user.tenantId);
      if (!plan) return res.status(404).json({ success: false, error: 'Rate plan not found' });
      res.json({ success: true, data: plan });
    } catch (err) { next(err); }
  }

  async updateVersion(req, res, next) {
    try {
      const plan = await RatePlanModel.createNewVersion(req.params.id, req.user.tenantId, req.body);

      try {
        const AuditLogService = (await import('../services/audit-log.service.js')).default;
        const old = await RatePlanModel.findById(req.params.id, req.user.tenantId);
        await AuditLogService.logSystemEvent({
          tenantId: req.user.tenantId, userId: req.user.id,
          action: 'rate_plan_version_created', entityType: 'rate_plan', entityId: plan.id,
          oldValue: { id: req.params.id, version: old?.version }, newValue: { id: plan.id, version: plan.version },
          ipAddress: req.ip, userAgent: req.get('user-agent'),
        });
      } catch (e) { /* non-blocking */ }

      res.status(201).json({ success: true, data: plan });
    } catch (err) { next(err); }
  }

  async deactivate(req, res, next) {
    try {
      const plan = await RatePlanModel.update(req.params.id, req.user.tenantId, { is_active: false });
      if (!plan) return res.status(404).json({ success: false, error: 'Rate plan not found' });
      res.json({ success: true, data: plan });
    } catch (err) { next(err); }
  }
}

export default new RatePlanController();
