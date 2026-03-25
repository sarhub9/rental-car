import apiClient from '@/lib/api-client';

// Deposit types
export interface DepositListParams {
  status?: string;
  page?: number;
  limit?: number;
}

export interface CreateDepositPayload {
  agreement_id: string;
  customer_id: string;
  amount: number;
  payment_method: string;
  notes?: string;
}

// Toll/Fine types
export interface TollFineListParams {
  page?: number;
  limit?: number;
  attribution_status?: string;
  type?: string;
}

// Maintenance types
export interface MaintenanceListParams {
  status?: string;
  vehicle_id?: string;
  page?: number;
  limit?: number;
}

export interface CreateMaintenancePayload {
  vehicle_id: string;
  type: string;
  description: string;
  estimated_cost?: number;
  scheduled_date?: string;
}

// ===== Deposits =====

export async function getDeposits(params?: DepositListParams) {
  const response = await apiClient.get('/deposits', { params });
  return response.data.data || response.data;
}

export async function createDeposit(payload: CreateDepositPayload) {
  const response = await apiClient.post('/deposits', payload);
  return response.data.data || response.data;
}

export async function getEligibleDeposits() {
  const response = await apiClient.get('/deposits/eligible');
  return response.data.data || response.data;
}

export async function useDeposit(id: string, amount: number) {
  const response = await apiClient.put(`/deposits/${id}/use`, { amount });
  return response.data.data || response.data;
}

export async function releaseDeposit(id: string) {
  const response = await apiClient.put(`/deposits/${id}/release`);
  return response.data.data || response.data;
}

export async function forfeitDeposit(id: string, justification: string) {
  const response = await apiClient.put(`/deposits/${id}/forfeit`, { justification });
  return response.data.data || response.data;
}

export async function refundDeposit(id: string) {
  const response = await apiClient.put(`/deposits/${id}/refund`);
  return response.data.data || response.data;
}

// ===== Toll & Fines =====

export async function importTollFines(formData: FormData) {
  const response = await apiClient.post('/toll-fines/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data || response.data;
}

export async function getTollFines(params?: TollFineListParams) {
  const response = await apiClient.get('/toll-fines', { params });
  return response.data.data || response.data;
}

export async function getUnmatchedTollFines() {
  const response = await apiClient.get('/toll-fines/unmatched');
  return response.data.data || response.data;
}

export async function assignTollFine(id: string, agreementId: string) {
  const response = await apiClient.put(`/toll-fines/${id}/assign`, {
    agreement_id: agreementId,
  });
  return response.data.data || response.data;
}

export async function getTollFinesByAgreement(agreementId: string) {
  const response = await apiClient.get(`/toll-fines/agreement/${agreementId}`);
  return response.data.data || response.data;
}

export async function reprocessTollFines() {
  const response = await apiClient.post('/toll-fines/reprocess');
  return response.data.data || response.data;
}

// ===== Maintenance =====

export async function getMaintenanceRecords(params?: MaintenanceListParams) {
  const response = await apiClient.get('/maintenance', { params });
  return response.data.data || response.data;
}

export async function createMaintenance(payload: CreateMaintenancePayload) {
  const response = await apiClient.post('/maintenance', payload);
  return response.data.data || response.data;
}

export async function getMaintenanceById(id: string) {
  const response = await apiClient.get(`/maintenance/${id}`);
  return response.data.data || response.data;
}

export async function getOverdueMaintenance() {
  const response = await apiClient.get('/maintenance/overdue');
  return response.data.data || response.data;
}

export async function getUpcomingMaintenance() {
  const response = await apiClient.get('/maintenance/upcoming');
  return response.data.data || response.data;
}

export async function startMaintenance(id: string) {
  const response = await apiClient.put(`/maintenance/${id}/start`);
  return response.data.data || response.data;
}

export async function completeMaintenance(id: string, actualCost: number) {
  const response = await apiClient.put(`/maintenance/${id}/complete`, {
    actual_cost: actualCost,
  });
  return response.data.data || response.data;
}

export async function cancelMaintenance(id: string) {
  const response = await apiClient.put(`/maintenance/${id}/cancel`);
  return response.data.data || response.data;
}

export async function getVehicleMaintenanceSummary(vehicleId: string) {
  const response = await apiClient.get(`/maintenance/vehicle/${vehicleId}/summary`);
  return response.data.data || response.data;
}

export const accountsService = {
  getDeposits,
  createDeposit,
  getEligibleDeposits,
  useDeposit,
  releaseDeposit,
  forfeitDeposit,
  refundDeposit,
  importTollFines,
  getTollFines,
  getUnmatchedTollFines,
  assignTollFine,
  getTollFinesByAgreement,
  reprocessTollFines,
  getMaintenanceRecords,
  createMaintenance,
  getMaintenanceById,
  getOverdueMaintenance,
  getUpcomingMaintenance,
  startMaintenance,
  completeMaintenance,
  cancelMaintenance,
  getVehicleMaintenanceSummary,
};
