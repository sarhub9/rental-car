import apiClient from '@/lib/api-client';

export interface CreateCustomerPayload {
  full_name_en: string;
  full_name_ar: string;
  phone_number: string;
  email: string;
  emirates_id: string;
  driving_license_number: string;
  license_expiry_date: string;
  customer_type: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
}

export interface CustomerListParams {
  page?: number;
  limit?: number;
  search?: string;
  [key: string]: unknown;
}

export async function createCustomer(payload: CreateCustomerPayload) {
  const response = await apiClient.post('/v1/customers', payload);
  return response.data.data || response.data;
}

export async function getCustomers(params?: CustomerListParams) {
  const response = await apiClient.get('/v1/customers', { params });
  return response.data.data || response.data;
}

export async function searchCustomers(query: string) {
  const response = await apiClient.get('/v1/customers/search', { params: { q: query } });
  return response.data.data || response.data;
}

export async function getCustomerById(id: string) {
  const response = await apiClient.get(`/v1/customers/${id}`);
  return response.data.data || response.data;
}

export async function updateCustomer(id: string, payload: Partial<CreateCustomerPayload>) {
  const response = await apiClient.patch(`/v1/customers/${id}`, payload);
  return response.data.data || response.data;
}

export const customerService = {
  createCustomer,
  getCustomers,
  searchCustomers,
  getCustomerById,
  updateCustomer,
};
