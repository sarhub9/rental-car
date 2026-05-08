import apiClient from '@/lib/api-client';

export interface DriverTaskListParams {
  status?: string;
  type?: string;
  page?: number;
  limit?: number;
}

export interface CompleteTaskPayload {
  odometer_reading: number;
  fuel_level: string;
  condition_notes: string;
  customer_confirmation_type: string;
}

export interface ReportDamagePayload {
  description: string;
  severity: string;
  vehicle_area: string;
  photos: string[];
}

export interface LocationPayload {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface RecoveryAttemptPayload {
  attempt_type?: string;
  outcome: string;
  notes: string;
  location_lat?: number;
  location_lng?: number;
  [key: string]: unknown;
}

export interface CreateTaskPayload {
  agreement_id: string;
  vehicle_id: string;
  customer_id: string;
  assigned_driver_id: string;
  task_type: string;
  priority: string;
  destination_address: string;
  scheduled_at: string;
  admin_notes?: string;
}

// Driver Tasks
export async function getDriverTasks(params?: DriverTaskListParams) {
  const response = await apiClient.get('/v1/driver/tasks', { params });
  return response.data.data || response.data;
}

export async function getDriverTaskById(taskId: string) {
  const response = await apiClient.get(`/v1/driver/tasks/${taskId}`);
  return response.data.data || response.data;
}

export async function startTask(taskId: string) {
  const response = await apiClient.post(`/v1/driver/tasks/${taskId}/start`);
  return response.data.data || response.data;
}

export async function completeTask(taskId: string, payload: CompleteTaskPayload) {
  const response = await apiClient.post(`/v1/driver/tasks/${taskId}/complete`, payload);
  return response.data.data || response.data;
}

export async function cancelTask(taskId: string, reason: string) {
  const response = await apiClient.post(`/v1/driver/tasks/${taskId}/cancel`, { reason });
  return response.data.data || response.data;
}

// Evidence
export async function uploadTaskEvidence(taskId: string, formData: FormData) {
  const response = await apiClient.post(`/v1/driver/tasks/${taskId}/evidence`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data || response.data;
}

export async function getTaskEvidence(taskId: string) {
  const response = await apiClient.get(`/v1/driver/tasks/${taskId}/evidence`);
  return response.data.data || response.data;
}

export async function uploadTaskSignature(taskId: string, formData: FormData) {
  const response = await apiClient.post(`/v1/driver/tasks/${taskId}/evidence/signature`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data || response.data;
}

// Damages
export async function reportDamage(taskId: string, payload: ReportDamagePayload) {
  const response = await apiClient.post(`/v1/driver/tasks/${taskId}/damages`, payload);
  return response.data.data || response.data;
}

export async function getTaskDamages(taskId: string) {
  const response = await apiClient.get(`/v1/driver/tasks/${taskId}/damages`);
  return response.data.data || response.data;
}

// Location
export async function updateTaskLocation(taskId: string, payload: LocationPayload) {
  const response = await apiClient.post(`/v1/driver/tasks/${taskId}/location`, payload);
  return response.data.data || response.data;
}

export async function getTaskLocation(taskId: string) {
  const response = await apiClient.get(`/v1/driver/tasks/${taskId}/location`);
  return response.data.data || response.data;
}

// Recovery Attempts
export async function addRecoveryAttempt(taskId: string, payload: RecoveryAttemptPayload) {
  const response = await apiClient.post(`/v1/driver/tasks/${taskId}/recovery-attempts`, payload);
  return response.data.data || response.data;
}

export async function getRecoveryAttempts(taskId: string) {
  const response = await apiClient.get(`/v1/driver/tasks/${taskId}/recovery-attempts`);
  return response.data.data || response.data;
}

// Admin Task Creation
export async function createTask(payload: CreateTaskPayload) {
  const response = await apiClient.post('/v1/tasks', payload);
  return response.data.data || response.data;
}

export const driverTaskService = {
  getDriverTasks,
  getDriverTaskById,
  startTask,
  completeTask,
  cancelTask,
  uploadTaskEvidence,
  getTaskEvidence,
  uploadTaskSignature,
  reportDamage,
  getTaskDamages,
  updateTaskLocation,
  getTaskLocation,
  addRecoveryAttempt,
  getRecoveryAttempts,
  createTask,
};
