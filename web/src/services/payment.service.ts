import apiClient from '@/lib/api-client';

export async function getPaymentsByCustomer(customerId: string) {
  const response = await apiClient.get('/v1/payments', { params: { customer_id: customerId } });
  return response.data.data || response.data;
}

export const paymentService = { getPaymentsByCustomer };
