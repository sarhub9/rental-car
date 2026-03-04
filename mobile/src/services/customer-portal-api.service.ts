import apiClient from './api-client';
import { DashboardData, Agreement, UserProfile, Invoice, Payment, Dispute, Notification, MessageThread, Message } from '../types';

/**
 * Customer Portal API Service
 * Handles all API calls for the rental customer portal
 */
class CustomerPortalApiService {
  private client = apiClient;

  /**
   * Get customer dashboard data
   */
  async getDashboard(): Promise<DashboardData> {
    const response = await this.client.get('/customer/dashboard');
    return response.data.data;
  }

  /**
   * Get customer's agreements
   */
  async getMyAgreements(params: {
    status?: string;
    limit?: number;
    offset?: number;
    search?: string;
  } = {}): Promise<{ data: Agreement[]; pagination: { total: number } }> {
    const response = await this.client.get('/customer/agreements', { params });
    return response.data;
  }

  /**
   * Get agreement detail
   */
  async getAgreementDetail(agreementId: string): Promise<Agreement> {
    const response = await this.client.get(`/customer/agreements/${agreementId}`);
    return response.data.data;
  }

  /**
   * Get agreement evidence
   */
  async getAgreementEvidence(agreementId: string) {
    const response = await this.client.get(`/customer/agreements/${agreementId}/evidence`);
    return response.data.data;
  }

  /**
   * Get agreement charges
   */
  async getAgreementCharges(agreementId: string) {
    const response = await this.client.get(`/customer/agreements/${agreementId}/charges`);
    return response.data.data;
  }

  /**
   * Get customer profile
   */
  async getProfile(): Promise<UserProfile> {
    const response = await this.client.get('/customer/profile');
    return response.data.data;
  }

  /**
   * Update customer profile
   */
  async updateProfile(data: Record<string, unknown>): Promise<UserProfile> {
    const response = await this.client.patch('/customer/profile', data);
    return response.data.data;
  }

  /**
   * Get customer's invoices
   */
  async getInvoices(params: { status?: string; limit?: number; offset?: number } = {}): Promise<Invoice[]> {
    const response = await this.client.get('/customer/invoices', { params });
    return response.data.data;
  }

  /**
   * Get invoice detail
   */
  async getInvoiceDetail(invoiceId: string): Promise<Invoice> {
    const response = await this.client.get(`/customer/invoices/${invoiceId}`);
    return response.data.data;
  }

  /**
   * Get customer's payment history
   */
  async getPayments(params: { limit?: number; offset?: number } = {}): Promise<Payment[]> {
    const response = await this.client.get('/customer/payments', { params });
    return response.data.data;
  }

  // ---- Dispute Methods ----

  /**
   * Create a dispute
   */
  async createDispute(data: {
    agreement_id: string;
    charge_id?: string;
    invoice_id?: string;
    subject: string;
    description: string;
  }): Promise<Dispute> {
    const response = await this.client.post('/customer/disputes', data);
    return response.data.data;
  }

  /**
   * Get customer's disputes
   */
  async getDisputes(params: { status?: string; limit?: number; offset?: number } = {}): Promise<Dispute[]> {
    const response = await this.client.get('/customer/disputes', { params });
    return response.data.data;
  }

  /**
   * Get dispute detail with messages
   */
  async getDisputeDetail(disputeId: string): Promise<Dispute> {
    const response = await this.client.get(`/customer/disputes/${disputeId}`);
    return response.data.data;
  }

  /**
   * Add message to dispute
   */
  async addDisputeMessage(disputeId: string, message: string, attachments?: string[]): Promise<void> {
    await this.client.post(`/customer/disputes/${disputeId}/messages`, { message, attachments });
  }

  // ---- Notification Methods ----

  /**
   * Get notifications list
   */
  async getNotifications(params: { limit?: number; offset?: number; unread_only?: boolean } = {}): Promise<Notification[]> {
    const response = await this.client.get('/customer/notifications', { params });
    return response.data.data;
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
    const response = await this.client.get('/customer/notifications/unread-count');
    return response.data.data.unread_count;
  }

  /**
   * Mark a notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    await this.client.post(`/customer/notifications/${notificationId}/read`);
  }

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsAsRead(): Promise<void> {
    await this.client.post('/customer/notifications/read-all');
  }

  /**
   * Register device for push notifications
   */
  async registerDevice(fcmToken: string, deviceType: 'IOS' | 'ANDROID', deviceName?: string): Promise<void> {
    await this.client.post('/customer/devices', {
      fcm_token: fcmToken,
      device_type: deviceType,
      device_name: deviceName,
    });
  }

  /**
   * Unregister device
   */
  async unregisterDevice(fcmToken: string): Promise<void> {
    await this.client.delete('/customer/devices', { data: { fcm_token: fcmToken } });
  }

  // ---- Message Methods ----

  /**
   * Create a new message thread
   */
  async createMessageThread(subject: string, message: string): Promise<MessageThread> {
    const response = await this.client.post('/customer/messages', { subject, message });
    return response.data.data;
  }

  /**
   * Get message threads list
   */
  async getMessageThreads(params: { status?: string; limit?: number; offset?: number } = {}): Promise<MessageThread[]> {
    const response = await this.client.get('/customer/messages', { params });
    return response.data.data;
  }

  /**
   * Get unread message count
   */
  async getUnreadMessageCount(): Promise<number> {
    const response = await this.client.get('/customer/messages/unread-count');
    return response.data.data.unread_count;
  }

  /**
   * Get thread with messages
   */
  async getMessageThread(threadId: string): Promise<MessageThread> {
    const response = await this.client.get(`/customer/messages/${threadId}`);
    return response.data.data;
  }

  /**
   * Add message to thread
   */
  async addMessageToThread(threadId: string, message: string, attachments?: string[]): Promise<Message> {
    const response = await this.client.post(`/customer/messages/${threadId}/messages`, { message, attachments });
    return response.data.data;
  }

  /**
   * Mark thread messages as read
   */
  async markThreadAsRead(threadId: string): Promise<void> {
    await this.client.post(`/customer/messages/${threadId}/read`);
  }
}

export default new CustomerPortalApiService();
