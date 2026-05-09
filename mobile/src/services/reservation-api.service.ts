import apiClient from './api-client';

class ReservationApiService {
  private client = apiClient;

  async createReservation(data: any) {
    const response = await this.client.post('/reservations', data);
    return response.data;
  }

  async listReservations(params: any = {}) {
    const response = await this.client.get('/reservations', { params });
    return response.data;
  }

  async getReservation(id: string) {
    const response = await this.client.get(`/reservations/${id}`);
    return response.data;
  }

  async updateReservation(id: string, data: any) {
    const response = await this.client.patch(`/reservations/${id}`, data);
    return response.data;
  }

  async confirmReservation(id: string) {
    const response = await this.client.post(`/reservations/${id}/confirm`);
    return response.data;
  }

  async assignVehicle(id: string, vehicleId: string) {
    const response = await this.client.post(`/reservations/${id}/assign-vehicle`, { vehicle_id: vehicleId });
    return response.data;
  }

  async cancelReservation(id: string, reason: string) {
    const response = await this.client.post(`/reservations/${id}/cancel`, { reason });
    return response.data;
  }

  async markNoShow(id: string) {
    const response = await this.client.post(`/reservations/${id}/no-show`);
    return response.data;
  }
}

export default new ReservationApiService();
