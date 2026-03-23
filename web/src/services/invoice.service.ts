import apiClient from '@/lib/api-client';

export interface RecordPaymentPayload {
  amount: number;
  payment_method: string;
  transaction_reference: string;
  payment_date: string;
}

export interface InvoiceListParams {
  status?: string;
  page?: number;
  limit?: number;
}

export async function generateInvoice(agreementId: string) {
  const response = await apiClient.post(`/invoices/generate/${agreementId}`);
  return response.data;
}

export async function getInvoices(params?: InvoiceListParams) {
  const response = await apiClient.get('/invoices', { params });
  return response.data;
}

export async function getInvoiceById(id: string) {
  const response = await apiClient.get(`/invoices/${id}`);
  return response.data;
}

export async function issueInvoice(id: string) {
  const response = await apiClient.patch(`/invoices/${id}/issue`);
  return response.data;
}

export async function voidInvoice(id: string, reason: string) {
  const response = await apiClient.patch(`/invoices/${id}/void`, { reason });
  return response.data;
}

export async function recordPayment(id: string, payload: RecordPaymentPayload) {
  const response = await apiClient.post(`/invoices/${id}/payments`, payload);
  return response.data;
}

export const invoiceService = {
  generateInvoice,
  getInvoices,
  getInvoiceById,
  issueInvoice,
  voidInvoice,
  recordPayment,
};
