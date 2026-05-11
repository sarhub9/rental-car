import apiClient from '@/lib/api-client';

export async function openCashDrawerSession(payload: { opening_balance: number; notes?: string }) {
  const response = await apiClient.post('/v1/cash-drawer/open', payload);
  return response.data.data || response.data;
}

export async function getCurrentSession() {
  const response = await apiClient.get('/v1/cash-drawer/current');
  return response.data.data || response.data;
}

export async function listCashDrawerSessions(params?: Record<string, any>) {
  const response = await apiClient.get('/v1/cash-drawer', { params });
  return response.data.data || response.data;
}

export async function closeSession(id: string, payload: { closing_balance: number; notes?: string }) {
  const response = await apiClient.post(`/v1/cash-drawer/${id}/close`, payload);
  return response.data.data || response.data;
}

export async function getSessionSummary(id: string) {
  const response = await apiClient.get(`/v1/cash-drawer/${id}/summary`);
  return response.data.data || response.data;
}

export const cashDrawerService = {
  openCashDrawerSession,
  getCurrentSession,
  listCashDrawerSessions,
  closeSession,
  getSessionSummary,
};
