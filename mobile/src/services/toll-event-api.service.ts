import apiClient from './api-client';

class TollEventApiService {
  private client = apiClient;

  async createEvent(data: any) {
    const response = await this.client.post('/tolls', data);
    return response.data;
  }

  async bulkImport(events: any[]) {
    const response = await this.client.post('/tolls/bulk-import', { events });
    return response.data;
  }

  async listEvents(params: any = {}) {
    const response = await this.client.get('/tolls', { params });
    return response.data;
  }

  async getEvent(id: string) {
    const response = await this.client.get(`/tolls/${id}`);
    return response.data;
  }

  async manualAttribute(id: string, agreementId: string, customerId: string) {
    const response = await this.client.post(`/tolls/${id}/attribute`, { agreement_id: agreementId, customer_id: customerId });
    return response.data;
  }

  async waiveEvent(id: string) {
    const response = await this.client.post(`/tolls/${id}/waive`);
    return response.data;
  }

  async getSummary() {
    const response = await this.client.get('/tolls/summary');
    return response.data;
  }
}

export default new TollEventApiService();
