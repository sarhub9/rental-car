import ReportsService from '../services/reports.service.js';

const handle = (fn) => async (req, res) => {
  try {
    const data = await fn(req);
    return res.json({ success: true, data });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    console.error('Reports error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
};

export default {
  vat:              handle(req => ReportsService.getVatReport(req.tenantId, req.query.from, req.query.to)),
  revenue:          handle(req => ReportsService.getRevenueReport(req.tenantId, req.query.from, req.query.to, req.query.group_by)),
  fleetUtilization: handle(req => ReportsService.getFleetUtilizationReport(req.tenantId, req.query.from, req.query.to)),
  vehicleProfit:    handle(req => ReportsService.getVehicleProfitabilityReport(req.tenantId, req.query.from, req.query.to)),
  maintenanceCost:  handle(req => ReportsService.getMaintenanceCostReport(req.tenantId, req.query.from, req.query.to)),
  damageRecovery:   handle(req => ReportsService.getDamageRecoveryReport(req.tenantId, req.query.from, req.query.to)),
  salikFine:        handle(req => ReportsService.getSalikFineReport(req.tenantId, req.query.from, req.query.to)),
  customerStatement:handle(req => ReportsService.getCustomerStatement(req.tenantId, req.params.customerId, req.query.from, req.query.to)),
  profitLoss:       handle(req => ReportsService.getProfitLoss(req.tenantId, req.query.from, req.query.to)),
};
