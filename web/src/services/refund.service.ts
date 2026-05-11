import apiClient from '@/lib/api-client';

export async function listRefunds(params?: Record<string, any>) {
  const response = await apiClient.get('/v1/refunds', { params });
  return response.data.data || response.data;
}

export async function getRefundById(id: string) {
  const response = await apiClient.get(`/v1/refunds/${id}`);
  return response.data.data || response.data;
}

export async function requestRefund(payload: any) {
  const response = await apiClient.post('/v1/refunds', payload);
  return response.data.data || response.data;
}

export async function approveRefund(id: string) {
  const response = await apiClient.post(`/v1/refunds/${id}/approve`);
  return response.data.data || response.data;
}

export async function rejectRefund(id: string, reason: string) {
  const response = await apiClient.post(`/v1/refunds/${id}/reject`, { reason });
  return response.data.data || response.data;
}

export async function processRefund(id: string) {
  const response = await apiClient.post(`/v1/refunds/${id}/process`);
  return response.data.data || response.data;
}

export const refundService = {
  listRefunds,
  getRefundById,
  requestRefund,
  approveRefund,
  rejectRefund,
  processRefund,
};
