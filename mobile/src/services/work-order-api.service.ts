import apiClient from './api-client';

class WorkOrderApiService {
  private client = apiClient;

  async createWorkOrder(data: any) {
    const response = await this.client.post('/work-orders', data);
    return response.data;
  }

  async listWorkOrders(params: any = {}) {
    const response = await this.client.get('/work-orders', { params });
    return response.data;
  }

  async getWorkOrder(id: string) {
    const response = await this.client.get(`/work-orders/${id}`);
    return response.data;
  }

  async updateWorkOrder(id: string, data: any) {
    const response = await this.client.patch(`/work-orders/${id}`, data);
    return response.data;
  }

  async addLineItem(id: string, data: any) {
    const response = await this.client.post(`/work-orders/${id}/line-items`, data);
    return response.data;
  }

  async getDueSoonSchedules(withinDays = 14) {
    const response = await this.client.get('/work-orders/maintenance/due-soon', { params: { within_days: withinDays } });
    return response.data;
  }

  async getVehicleCostStats(vehicleId: string) {
    const response = await this.client.get(`/work-orders/vehicle/${vehicleId}/cost-stats`);
    return response.data;
  }

  async createMaintenanceSchedule(data: any) {
    const response = await this.client.post('/work-orders/schedules', data);
    return response.data;
  }
}

export default new WorkOrderApiService();
