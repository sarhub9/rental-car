import apiClient from '@/lib/api-client';

export async function listIncidents(params?: Record<string, any>) {
  const response = await apiClient.get('/v1/incidents', { params });
  return response.data.data || response.data;
}

export async function getIncidentById(id: string) {
  const response = await apiClient.get(`/v1/incidents/${id}`);
  return response.data.data || response.data;
}

export async function createIncident(payload: any) {
  const response = await apiClient.post('/v1/incidents', payload);
  return response.data.data || response.data;
}

export async function updateIncident(id: string, payload: any) {
  const response = await apiClient.patch(`/v1/incidents/${id}`, payload);
  return response.data.data || response.data;
}

export async function addIncidentPhoto(id: string, formData: FormData) {
  const response = await apiClient.post(`/v1/incidents/${id}/photos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data || response.data;
}

export async function getIncidentPhotos(id: string) {
  const response = await apiClient.get(`/v1/incidents/${id}/photos`);
  return response.data.data || response.data;
}

export const incidentService = {
  listIncidents,
  getIncidentById,
  createIncident,
  updateIncident,
  addIncidentPhoto,
  getIncidentPhotos,
};
