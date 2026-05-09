import apiClient from '@/lib/api-client';

export interface CustomerPayload {
  customer_type?: string;
  full_name_en?: string;
  full_name_ar?: string;
  phone_number?: string;
  whatsapp_number?: string;
  email?: string;
  nationality?: string;
  date_of_birth?: string;
  // UAE Resident
  emirates_id?: string;
  id_expiry_date?: string;
  driving_license_number?: string;
  license_expiry_date?: string;
  // Tourist
  passport_number?: string;
  passport_expiry?: string;
  visa_number?: string;
  visa_expiry?: string;
  hotel_name?: string;
  hotel_address?: string;
  arrival_date?: string;
  departure_date?: string;
  // Company / Corporate
  company_name?: string;
  trade_license_number?: string;
  trade_license_expiry?: string;
  trn_number?: string;
  authorized_person_name?: string;
  authorized_person_mobile?: string;
  payment_terms?: string;
  credit_limit?: number | string;
  // Address
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  emirate?: string;
  // Status
  is_active?: boolean;
  is_blacklisted?: boolean;
  blacklist_reason?: string;
  verification_status?: string;
}

export const customerService = {
  async createCustomer(payload: CustomerPayload) {
    const response = await apiClient.post('/v1/customers', payload);
    return response.data?.data ?? response.data;
  },

  async getCustomers(params?: Record<string, unknown>) {
    const response = await apiClient.get('/v1/customers', { params });
    return response.data?.data ?? response.data;
  },

  async searchCustomers(query: string) {
    const response = await apiClient.get('/v1/customers/search', { params: { q: query } });
    return response.data?.data ?? response.data;
  },

  async getCustomerById(id: string) {
    const response = await apiClient.get(`/v1/customers/${id}`);
    return response.data?.data ?? response.data;
  },

  async updateCustomer(id: string, payload: CustomerPayload) {
    const response = await apiClient.patch(`/v1/customers/${id}`, payload);
    return response.data?.data ?? response.data;
  },
};
