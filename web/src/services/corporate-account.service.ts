import apiClient from '@/lib/api-client';

export async function listCorporateAccounts(params?: Record<string, any>) {
  const response = await apiClient.get('/v1/corporate-accounts', { params });
  return response.data.data || response.data;
}

export async function getCorporateAccountById(id: string) {
  const response = await apiClient.get(`/v1/corporate-accounts/${id}`);
  return response.data.data || response.data;
}

export async function createCorporateAccount(payload: any) {
  const response = await apiClient.post('/v1/corporate-accounts', payload);
  return response.data.data || response.data;
}

export async function updateCorporateAccount(id: string, payload: any) {
  const response = await apiClient.patch(`/v1/corporate-accounts/${id}`, payload);
  return response.data.data || response.data;
}

export async function getARAgingReport(params?: Record<string, any>) {
  const response = await apiClient.get('/v1/corporate-accounts/reports/ar-aging', { params });
  return response.data.data || response.data;
}

export const corporateAccountService = {
  listCorporateAccounts,
  getCorporateAccountById,
  createCorporateAccount,
  updateCorporateAccount,
  getARAgingReport,
};
