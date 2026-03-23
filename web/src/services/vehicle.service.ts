import apiClient from '@/lib/api-client';

export interface CreateVehiclePayload {
  make: string;
  model: string;
  year: number;
  color?: string;
  plate_number: string;
  plate_emirate?: string;
  chassis_number?: string;
  vehicle_number?: string;
  transmission_type?: string;
  fuel_type?: string;
  current_odometer?: number;
  daily_rate?: number;
  weekly_rate?: number;
  registration_expiry?: string;
  insurance_expiry?: string;
  category_id?: string;
  status?: string;
  [key: string]: unknown;
}

export interface VehicleListParams {
  status?: string;
  category_id?: string;
  page?: number;
  limit?: number;
}

export interface AvailableVehiclesParams {
  start_date: string;
  end_date: string;
}

export async function createVehicle(payload: CreateVehiclePayload) {
  const response = await apiClient.post('/vehicles', payload);
  return response.data;
}

export async function getVehicles(params?: VehicleListParams) {
  const response = await apiClient.get('/vehicles', { params });
  return response.data;
}

export async function getVehicleById(id: string) {
  const response = await apiClient.get(`/vehicles/${id}`);
  return response.data;
}

export async function updateVehicle(id: string, payload: Partial<CreateVehiclePayload>) {
  const response = await apiClient.patch(`/vehicles/${id}`, payload);
  return response.data;
}

export async function getAvailableVehicles(params: AvailableVehiclesParams) {
  const response = await apiClient.get('/vehicles/available', { params });
  return response.data;
}

export const vehicleService = {
  createVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  getAvailableVehicles,
};
