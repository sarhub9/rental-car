import apiClient from './api-client';

/**
 * Admin API Service
 * Authenticated API client for admin endpoints
 */
class AdminApiService {
  private client = apiClient;

  // ============================================================================
  // Dashboard
  // ============================================================================

  async getDashboard() {
    const response = await this.client.get('/admin/dashboard');
    return response.data.data;
  }

  // ============================================================================
  // Users
  // ============================================================================

  async listUsers(filters?: { role?: string; status?: string; limit?: number; offset?: number }) {
    const response = await this.client.get('/admin/users', { params: filters });
    return response.data.data;
  }

  async getUser(id: string) {
    const response = await this.client.get(`/admin/users/${id}`);
    return response.data.data;
  }

  async createUser(data: {
    full_name: string;
    email: string;
    phone_number: string;
    role: string;
    password: string;
  }) {
    const response = await this.client.post('/admin/users', data);
    return response.data.data;
  }

  async updateUser(id: string, data: { full_name?: string; email?: string; phone_number?: string; role?: string }) {
    const response = await this.client.patch(`/admin/users/${id}`, data);
    return response.data.data;
  }

  async deactivateUser(id: string) {
    const response = await this.client.post(`/admin/users/${id}/deactivate`);
    return response.data.data;
  }

  async activateUser(id: string) {
    const response = await this.client.post(`/admin/users/${id}/activate`);
    return response.data.data;
  }

  async resetUserPassword(id: string) {
    const response = await this.client.post(`/admin/users/${id}/reset-password`);
    return response.data.data;
  }

  // ============================================================================
  // Reports
  // ============================================================================

  async getRevenueReport(period: string = 'month') {
    const response = await this.client.get('/admin/reports/revenue', { params: { period } });
    return response.data.data;
  }

  async getReceivables() {
    const response = await this.client.get('/admin/reports/receivables');
    return response.data.data;
  }

  async getAgreementStats() {
    const response = await this.client.get('/admin/reports/agreements');
    return response.data.data;
  }

  async getVehicleStats() {
    const response = await this.client.get('/admin/vehicles/stats');
    return response.data.data;
  }

  // ============================================================================
  // Audit Logs
  // ============================================================================

  async getAuditLogs(filters?: {
    event_type?: string;
    user_id?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
  }) {
    const response = await this.client.get('/admin/audit-logs', { params: filters });
    return response.data.data;
  }

  // ============================================================================
  // Settings
  // ============================================================================

  async getSettings() {
    const response = await this.client.get('/admin/settings');
    return response.data.data;
  }

  async updateSettings(data: {
    km_allowance_per_day?: number;
    rate_per_extra_km?: number;
    fuel_refill_rate?: number;
    late_fee_per_hour?: number;
    grace_period_minutes?: number;
  }) {
    const response = await this.client.patch('/admin/settings', data);
    return response.data.data;
  }
}

export default new AdminApiService();
