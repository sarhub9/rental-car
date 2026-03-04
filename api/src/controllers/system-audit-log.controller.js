import SystemAuditLogModel from '../models/system-audit-log.model.js';

class SystemAuditLogController {
  async list(req, res, next) {
    try {
      const filters = {
        date_from: req.query.date_from, date_to: req.query.date_to,
        user_id: req.query.user_id, action: req.query.action,
        entity_type: req.query.entity_type, entity_id: req.query.entity_id,
        limit: req.query.limit ? parseInt(req.query.limit) : 50,
        offset: req.query.offset ? parseInt(req.query.offset) : 0,
      };
      const [entries, total] = await Promise.all([
        SystemAuditLogModel.list(req.user.tenantId, filters),
        SystemAuditLogModel.count(req.user.tenantId, filters),
      ]);
      res.json({ success: true, data: entries, pagination: { total, limit: filters.limit, offset: filters.offset } });
    } catch (err) { next(err); }
  }

  async exportCsv(req, res, next) {
    try {
      const entries = await SystemAuditLogModel.list(req.user.tenantId, {
        date_from: req.query.date_from, date_to: req.query.date_to,
        action: req.query.action, entity_type: req.query.entity_type,
        limit: 10000,
      });

      const header = 'id,timestamp,user,action,entity_type,entity_id,old_value,new_value,justification\n';
      const rows = entries.map(e =>
        `${e.id},"${e.created_at}","${e.user_name || e.user_id}","${e.action}","${e.entity_type}","${e.entity_id || ''}","${JSON.stringify(e.old_value || '').replace(/"/g, '""')}","${JSON.stringify(e.new_value || '').replace(/"/g, '""')}","${(e.justification || '').replace(/"/g, '""')}"`
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=audit-log-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(header + rows);
    } catch (err) { next(err); }
  }
}

export default new SystemAuditLogController();
