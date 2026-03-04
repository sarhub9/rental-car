import apiClient from './api-client';
import { Vehicle } from '../types';

class VehicleApiService {
  private client = apiClient;

  async searchAvailable(startDate: string, endDate: string): Promise<Vehicle[]> {
    const response = await this.client.get('/vehicles/available', {
      params: { start_date: startDate, end_date: endDate },
    });
    return response.data.data;
  }

  async listVehicles(params: Record<string, string | number> = {}): Promise<Vehicle[]> {
    const response = await this.client.get('/vehicles', { params });
    return response.data.data;
  }

  async getVehicle(id: string): Promise<Vehicle> {
    const response = await this.client.get(`/vehicles/${id}`);
    return response.data.data;
  }

  async createVehicle(data: {
    make: string;
    model: string;
    year: number;
    plate_number: string;
    plate_emirate: string;
    transmission_type: string;
    fuel_type: string;
    color?: string;
    chassis_number?: string;
    daily_rate?: number;
    weekly_rate?: number;
    current_odometer?: number;
    registration_expiry?: string;
    insurance_expiry?: string;
  }): Promise<Vehicle> {
    const response = await this.client.post('/vehicles', data);
    return response.data.data;
  }

  async updateVehicle(id: string, data: Partial<Vehicle>): Promise<Vehicle> {
    const response = await this.client.patch(`/vehicles/${id}`, data);
    return response.data.data;
  }
}

export default new VehicleApiService();
