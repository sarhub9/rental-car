import apiClient from '@/lib/api-client';

export async function listVehicleCategories() {
  const response = await apiClient.get('/v1/vehicle-categories');
  return response.data?.data ?? response.data ?? [];
}

export async function createVehicleCategory(payload: any) {
  const response = await apiClient.post('/v1/vehicle-categories', payload);
  return response.data?.data ?? response.data;
}

export async function updateVehicleCategory(id: string, payload: any) {
  const response = await apiClient.put(`/v1/vehicle-categories/${id}`, payload);
  return response.data?.data ?? response.data;
}

export const vehicleCategoryService = { listVehicleCategories, createVehicleCategory, updateVehicleCategory };
