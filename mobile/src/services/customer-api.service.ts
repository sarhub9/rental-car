import apiClient from './api-client';
import { Customer } from '../types';

class CustomerApiService {
  private client = apiClient;

  async searchCustomers(query: string): Promise<Customer[]> {
    const response = await this.client.get('/customers/search', { params: { q: query } });
    return response.data.data;
  }

  async listCustomers(params: Record<string, string | number> = {}): Promise<Customer[]> {
    const response = await this.client.get('/customers', { params });
    return response.data.data;
  }

  async getCustomer(id: string): Promise<Customer> {
    const response = await this.client.get(`/customers/${id}`);
    return response.data.data;
  }
}

export default new CustomerApiService();
