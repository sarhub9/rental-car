import apiClient from '@/lib/api-client';

export async function listWorkOrders(params?: Record<string, any>) {
  const response = await apiClient.get('/v1/work-orders', { params });
  return response.data.data || response.data;
}

export async function getWorkOrderById(id: string) {
  const response = await apiClient.get(`/v1/work-orders/${id}`);
  return response.data.data || response.data;
}

export async function createWorkOrder(payload: any) {
  const response = await apiClient.post('/v1/work-orders', payload);
  return response.data.data || response.data;
}

export async function updateWorkOrder(id: string, payload: any) {
  const response = await apiClient.patch(`/v1/work-orders/${id}`, payload);
  return response.data.data || response.data;
}

export async function addLineItem(id: string, payload: any) {
  const response = await apiClient.post(`/v1/work-orders/${id}/line-items`, payload);
  return response.data.data || response.data;
}

export async function getDueSoonWorkOrders() {
  const response = await apiClient.get('/v1/work-orders/maintenance/due-soon');
  return response.data.data || response.data;
}

export async function getVehicleCostStats(vehicleId: string) {
  const response = await apiClient.get(`/v1/work-orders/vehicle/${vehicleId}/cost-stats`);
  return response.data.data || response.data;
}

export async function createMaintenanceSchedule(payload: any) {
  const response = await apiClient.post('/v1/work-orders/schedules', payload);
  return response.data.data || response.data;
}

export const workOrderService = {
  listWorkOrders,
  getWorkOrderById,
  createWorkOrder,
  updateWorkOrder,
  addLineItem,
  getDueSoonWorkOrders,
  getVehicleCostStats,
  createMaintenanceSchedule,
};
