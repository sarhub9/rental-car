import apiClient from '@/lib/api-client';

const get = (url: string, params?: any) =>
  apiClient.get(url, { params }).then(r => {
    const d = r.data;
    return d !== null && typeof d === 'object' && 'data' in d ? d.data : d;
  });

export const reportsService = {
  getVatReport:             (from?: string, to?: string)               => get('/v1/reports/vat',              { from, to }),
  getRevenueReport:         (from?: string, to?: string, group_by?: string) => get('/v1/reports/revenue',     { from, to, group_by }),
  getFleetUtilization:      (from?: string, to?: string)               => get('/v1/reports/fleet-utilization', { from, to }),
  getVehicleProfit:         (from?: string, to?: string)               => get('/v1/reports/vehicle-profit',   { from, to }),
  getMaintenanceCost:       (from?: string, to?: string)               => get('/v1/reports/maintenance-cost', { from, to }),
  getDamageRecovery:        (from?: string, to?: string)               => get('/v1/reports/damage-recovery',  { from, to }),
  getSalikFines:            (from?: string, to?: string)               => get('/v1/reports/salik-fines',      { from, to }),
  getCustomerStatement:     (customerId: string, from?: string, to?: string) => get(`/v1/reports/customer-statement/${customerId}`, { from, to }),
  getProfitLoss:            (from?: string, to?: string) => get('/v1/reports/profit-loss', { from, to }),
};
