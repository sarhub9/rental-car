import apiClient from '@/lib/api-client';

export async function getAdminSettings() {
  const response = await apiClient.get('/v1/admin/settings');
  return response.data.data || response.data;
}

export async function updateAdminSettings(payload: any) {
  const response = await apiClient.patch('/v1/admin/settings', payload);
  return response.data.data || response.data;
}

export async function listAuditLogs(params?: Record<string, any>) {
  const response = await apiClient.get('/v1/admin/audit-logs', { params });
  return response.data.data || response.data;
}

export const adminSettingsService = {
  getAdminSettings,
  updateAdminSettings,
  listAuditLogs,
};
