import apiClient from '@/lib/api-client';

export interface CreateUserPayload {
  full_name: string;
  email: string;
  phone_number: string;
  role: string;
  password: string;
}

export interface UserListParams {
  page?: number;
  limit?: number;
}

export interface RevenueReportParams {
  period: 'monthly' | 'weekly';
}

export interface AuditLogParams {
  page?: number;
  limit?: number;
  entity_type?: string;
  user_id?: string;
}

export interface KpiParams {
  from: string;
  to: string;
}

// Dashboard
export async function getAdminDashboard() {
  const response = await apiClient.get('/admin/dashboard');
  return response.data.data || response.data;
}

// Reports
export async function getRevenueReport(params: RevenueReportParams) {
  const response = await apiClient.get('/admin/reports/revenue', { params });
  return response.data.data || response.data;
}

export async function getReceivablesReport() {
  const response = await apiClient.get('/admin/reports/receivables');
  return response.data.data || response.data;
}

export async function getAgreementsReport() {
  const response = await apiClient.get('/admin/reports/agreements');
  return response.data.data || response.data;
}

// Vehicle Stats
export async function getVehicleStats() {
  const response = await apiClient.get('/admin/vehicles/stats');
  return response.data.data || response.data;
}

// User Management
export async function getUsers(params?: UserListParams) {
  const response = await apiClient.get('/admin/users', { params });
  return response.data.data || response.data;
}

export async function createUser(payload: CreateUserPayload) {
  const response = await apiClient.post('/admin/users', payload);
  return response.data.data || response.data;
}

export async function getUserById(id: string) {
  const response = await apiClient.get(`/admin/users/${id}`);
  return response.data.data || response.data;
}

export async function updateUser(id: string, payload: Partial<CreateUserPayload>) {
  const response = await apiClient.patch(`/admin/users/${id}`, payload);
  return response.data.data || response.data;
}

export async function deactivateUser(id: string) {
  const response = await apiClient.post(`/admin/users/${id}/deactivate`);
  return response.data.data || response.data;
}

export async function activateUser(id: string) {
  const response = await apiClient.post(`/admin/users/${id}/activate`);
  return response.data.data || response.data;
}

export async function resetUserPassword(id: string) {
  const response = await apiClient.post(`/admin/users/${id}/reset-password`);
  return response.data.data || response.data;
}

// KPIs
export async function getKpis(params: KpiParams) {
  const response = await apiClient.get('/kpis', { params });
  return response.data.data || response.data;
}

// Audit Log
export async function getAuditLog(params?: AuditLogParams) {
  const response = await apiClient.get('/audit-log', { params });
  return response.data.data || response.data;
}

export const adminService = {
  getAdminDashboard,
  getRevenueReport,
  getReceivablesReport,
  getAgreementsReport,
  getVehicleStats,
  getUsers,
  createUser,
  getUserById,
  updateUser,
  deactivateUser,
  activateUser,
  resetUserPassword,
  getKpis,
  getAuditLog,
};
