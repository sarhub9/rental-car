import apiClient from '@/lib/api-client';

export interface DisputeListParams {
  status?: string;
  page?: number;
  limit?: number;
}

export interface UpdateDisputeStatusPayload {
  status: string;
  notes: string;
}

export async function getDisputes(params?: DisputeListParams) {
  const response = await apiClient.get('/v1/disputes', { params });
  return response.data.data || response.data;
}

export async function updateDisputeStatus(id: string, payload: UpdateDisputeStatusPayload) {
  const response = await apiClient.patch(`/v1/disputes/${id}/status`, payload);
  return response.data.data || response.data;
}

export async function sendDisputeMessage(id: string, message: string) {
  const response = await apiClient.post(`/v1/disputes/${id}/messages`, { message });
  return response.data.data || response.data;
}

export const disputeService = {
  getDisputes,
  updateDisputeStatus,
  sendDisputeMessage,
};
