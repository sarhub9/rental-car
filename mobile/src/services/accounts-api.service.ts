import apiClient from './api-client';
import { Invoice, Payment } from '../types';

class AccountsApiService {
  private client = apiClient;

  async listInvoices(params: Record<string, string | number> = {}): Promise<Invoice[]> {
    const response = await this.client.get('/invoices', { params });
    return response.data.data;
  }

  async getInvoice(id: string): Promise<Invoice> {
    const response = await this.client.get(`/invoices/${id}`);
    return response.data.data;
  }

  async issueInvoice(id: string): Promise<Invoice> {
    const response = await this.client.patch(`/invoices/${id}/issue`);
    return response.data.data;
  }

  async voidInvoice(id: string): Promise<Invoice> {
    const response = await this.client.patch(`/invoices/${id}/void`);
    return response.data.data;
  }

  async recordPayment(invoiceId: string, data: {
    amount: number;
    payment_method: string;
    transaction_reference?: string;
  }): Promise<Payment> {
    const response = await this.client.post(`/invoices/${invoiceId}/payments`, data);
    return response.data.data;
  }

  async generateInvoice(agreementId: string): Promise<Invoice> {
    const response = await this.client.post(`/invoices/generate/${agreementId}`);
    return response.data.data;
  }

  async getRevenueReport(period: string = 'month') {
    const response = await this.client.get('/admin/reports/revenue', { params: { period } });
    return response.data.data;
  }

  async getReceivables() {
    const response = await this.client.get('/admin/reports/receivables');
    return response.data.data;
  }
}

export default new AccountsApiService();
