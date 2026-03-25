import apiClient from '@/lib/api-client';

export interface PaginationParams {
  page?: number;
  limit?: number;
  status?: string;
  [key: string]: unknown;
}

export interface CreateDisputePayload {
  agreement_id: string;
  charge_id?: string;
  subject: string;
  description: string;
  [key: string]: unknown;
}

export interface UpdateProfilePayload {
  [key: string]: unknown;
}

// Dashboard
export async function getCustomerDashboard() {
  const response = await apiClient.get('/customer/dashboard');
  return response.data.data || response.data;
}

// Agreements
export async function getCustomerAgreements(params?: PaginationParams) {
  const response = await apiClient.get('/customer/agreements', { params });
  return response.data.data || response.data;
}

export async function getCustomerAgreementById(id: string) {
  const response = await apiClient.get(`/customer/agreements/${id}`);
  return response.data.data || response.data;
}

export async function getCustomerAgreementEvidence(id: string) {
  const response = await apiClient.get(`/customer/agreements/${id}/evidence`);
  return response.data.data || response.data;
}

export async function getCustomerAgreementCharges(id: string) {
  const response = await apiClient.get(`/customer/agreements/${id}/charges`);
  return response.data.data || response.data;
}

// Profile
export async function getCustomerProfile() {
  const response = await apiClient.get('/customer/profile');
  return response.data.data || response.data;
}

export async function updateCustomerProfile(payload: UpdateProfilePayload) {
  const response = await apiClient.patch('/customer/profile', payload);
  return response.data.data || response.data;
}

// Invoices
export async function getCustomerInvoices(params?: PaginationParams) {
  const response = await apiClient.get('/customer/invoices', { params });
  return response.data.data || response.data;
}

export async function getCustomerInvoiceById(id: string) {
  const response = await apiClient.get(`/customer/invoices/${id}`);
  return response.data.data || response.data;
}

// Payments
export async function getCustomerPayments(params?: PaginationParams) {
  const response = await apiClient.get('/customer/payments', { params });
  return response.data.data || response.data;
}

// Notifications
export async function getCustomerNotifications() {
  const response = await apiClient.get('/customer/notifications');
  return response.data.data || response.data;
}

export async function getUnreadNotificationCount() {
  const response = await apiClient.get('/customer/notifications/unread-count');
  return response.data.data || response.data;
}

export async function markNotificationAsRead(id: string) {
  const response = await apiClient.post(`/customer/notifications/${id}/read`);
  return response.data.data || response.data;
}

export async function markAllNotificationsAsRead() {
  const response = await apiClient.post('/customer/notifications/read-all');
  return response.data.data || response.data;
}

// Disputes
export async function createDispute(payload: CreateDisputePayload) {
  const response = await apiClient.post('/customer/disputes', payload);
  return response.data.data || response.data;
}

export async function getCustomerDisputes() {
  const response = await apiClient.get('/customer/disputes');
  return response.data.data || response.data;
}

export async function getCustomerDisputeById(id: string) {
  const response = await apiClient.get(`/customer/disputes/${id}`);
  return response.data.data || response.data;
}

export async function sendDisputeMessage(id: string, message: string) {
  const response = await apiClient.post(`/customer/disputes/${id}/messages`, { message });
  return response.data.data || response.data;
}

// Messages
export async function createMessage(payload: { subject: string; message_text: string }) {
  const response = await apiClient.post('/customer/messages', payload);
  return response.data.data || response.data;
}

export async function getCustomerMessages() {
  const response = await apiClient.get('/customer/messages');
  return response.data.data || response.data;
}

export async function getUnreadMessageCount() {
  const response = await apiClient.get('/customer/messages/unread-count');
  return response.data.data || response.data;
}

export async function getCustomerMessageById(id: string) {
  const response = await apiClient.get(`/customer/messages/${id}`);
  return response.data.data || response.data;
}

export async function replyToMessage(id: string, messageText: string) {
  const response = await apiClient.post(`/customer/messages/${id}/messages`, {
    message_text: messageText,
  });
  return response.data.data || response.data;
}

export async function markMessageAsRead(id: string) {
  const response = await apiClient.post(`/customer/messages/${id}/read`);
  return response.data.data || response.data;
}

export const customerPortalService = {
  getCustomerDashboard,
  getCustomerAgreements,
  getCustomerAgreementById,
  getCustomerAgreementEvidence,
  getCustomerAgreementCharges,
  getCustomerProfile,
  updateCustomerProfile,
  getCustomerInvoices,
  getCustomerInvoiceById,
  getCustomerPayments,
  getCustomerNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createDispute,
  getCustomerDisputes,
  getCustomerDisputeById,
  sendDisputeMessage,
  createMessage,
  getCustomerMessages,
  getUnreadMessageCount,
  getCustomerMessageById,
  replyToMessage,
  markMessageAsRead,
};
