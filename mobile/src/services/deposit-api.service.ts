import apiClient from './api-client';

class DepositApiService {
  private client = apiClient;

  async collectDeposit(data: any) {
    const response = await this.client.post('/deposits', data);
    return response.data;
  }

  async listDeposits(params: any = {}) {
    const response = await this.client.get('/deposits', { params });
    return response.data;
  }

  async getDeposit(id: string) {
    const response = await this.client.get(`/deposits/${id}`);
    return response.data;
  }

  async getDepositsByAgreement(agreementId: string) {
    const response = await this.client.get(`/deposits/agreement/${agreementId}`);
    return response.data;
  }

  async releaseDeposit(id: string, releaseNotes?: string) {
    const response = await this.client.post(`/deposits/${id}/release`, { release_notes: releaseNotes });
    return response.data;
  }

  async forfeitDeposit(id: string, reason: string) {
    const response = await this.client.post(`/deposits/${id}/forfeit`, { reason });
    return response.data;
  }
}

export default new DepositApiService();
