import apiClient from '@/lib/api-client';

export async function listBranches(params?: Record<string, any>) {
  const response = await apiClient.get('/v1/branches', { params });
  return response.data.data || response.data;
}

export async function getBranchById(id: string) {
  const response = await apiClient.get(`/v1/branches/${id}`);
  return response.data.data || response.data;
}

export async function createBranch(payload: any) {
  const response = await apiClient.post('/v1/branches', payload);
  return response.data.data || response.data;
}

export async function updateBranch(id: string, payload: any) {
  const response = await apiClient.patch(`/v1/branches/${id}`, payload);
  return response.data.data || response.data;
}

export async function deactivateBranch(id: string) {
  const response = await apiClient.delete(`/v1/branches/${id}`);
  return response.data.data || response.data;
}

export const branchService = {
  listBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deactivateBranch,
};
