import apiClient from '@/lib/api-client';

export async function listReservations(params?: Record<string, any>) {
  const response = await apiClient.get('/v1/reservations', { params });
  return response.data.data || response.data;
}

export async function getReservationById(id: string) {
  const response = await apiClient.get(`/v1/reservations/${id}`);
  return response.data.data || response.data;
}

export async function createReservation(payload: any) {
  const response = await apiClient.post('/v1/reservations', payload);
  return response.data.data || response.data;
}

export async function updateReservation(id: string, payload: any) {
  const response = await apiClient.patch(`/v1/reservations/${id}`, payload);
  return response.data.data || response.data;
}

export async function confirmReservation(id: string) {
  const response = await apiClient.post(`/v1/reservations/${id}/confirm`);
  return response.data.data || response.data;
}

export async function assignVehicle(id: string, vehicleId: string) {
  const response = await apiClient.post(`/v1/reservations/${id}/assign-vehicle`, { vehicle_id: vehicleId });
  return response.data.data || response.data;
}

export async function cancelReservation(id: string, reason?: string) {
  const response = await apiClient.post(`/v1/reservations/${id}/cancel`, { reason });
  return response.data.data || response.data;
}

export async function markNoShow(id: string) {
  const response = await apiClient.post(`/v1/reservations/${id}/no-show`);
  return response.data.data || response.data;
}

export async function saveReservationSignature(id: string, customer_signature_url: string) {
  const response = await apiClient.patch(`/v1/reservations/${id}/signature`, { customer_signature_url });
  return response.data.data || response.data;
}

export const reservationService = {
  listReservations,
  getReservationById,
  createReservation,
  updateReservation,
  confirmReservation,
  assignVehicle,
  cancelReservation,
  markNoShow,
  saveReservationSignature,
};
