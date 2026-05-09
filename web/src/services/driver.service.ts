import apiClient from '@/lib/api-client';

export interface DriverProfile {
  id: string;
  tenant_id: string;
  driver_number: string;
  driver_type: 'MAIN_CUSTOMER' | 'ADDITIONAL' | 'COMPANY' | 'CORPORATE' | 'STAFF_DELIVERY' | 'STAFF_COLLECTION';
  full_name: string;
  phone_number: string;
  whatsapp_number?: string;
  email?: string;
  nationality?: string;
  date_of_birth?: string;
  address?: string;
  emirates_id?: string;
  emirates_id_expiry?: string;
  passport_number?: string;
  passport_expiry?: string;
  visa_number?: string;
  visa_expiry?: string;
  driving_license_number: string;
  license_expiry_date: string;
  license_country?: string;
  idp_required?: boolean;
  idp_number?: string;
  idp_expiry?: string;
  customer_id?: string;
  customer_name?: string;
  company_id?: string;
  corporate_account_id?: string;
  is_active: boolean;
  is_blacklisted: boolean;
  blacklist_reason?: string;
  created_at: string;
}

export const driverService = {
  async listDrivers(params?: Record<string, any>) {
    const res = await apiClient.get('/v1/drivers', { params });
    return res.data;
  },

  async searchDrivers(q: string) {
    const res = await apiClient.get('/drivers/search', { params: { q } });
    return res.data;
  },

  async getDriver(id: string) {
    const res = await apiClient.get(`/drivers/${id}`);
    return res.data;
  },

  async createDriver(data: Partial<DriverProfile>) {
    const res = await apiClient.post('/v1/drivers', data);
    return res.data;
  },

  async updateDriver(id: string, data: Partial<DriverProfile>) {
    const res = await apiClient.patch(`/drivers/${id}`, data);
    return res.data;
  },

  async validateDriverDocs(id: string) {
    const res = await apiClient.get(`/drivers/${id}/validate`);
    return res.data;
  },

  async blacklistDriver(id: string, reason: string) {
    const res = await apiClient.post(`/drivers/${id}/blacklist`, { reason });
    return res.data;
  },

  async unblacklistDriver(id: string) {
    const res = await apiClient.post(`/drivers/${id}/unblacklist`);
    return res.data;
  },
};
