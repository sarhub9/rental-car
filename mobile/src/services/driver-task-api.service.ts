import apiClient from './api-client';

/**
 * Driver Task API Service
 * Handles all API calls related to driver tasks
 */
class DriverTaskApiService {
  private client = apiClient;

  /**
   * List driver tasks with optional filters
   */
  async listTasks(params = {}) {
    const response = await this.client.get('/driver/tasks', { params });
    return response.data;
  }

  /**
   * Get task by ID
   */
  async getTask(taskId) {
    const response = await this.client.get(`/driver/tasks/${taskId}`);
    return response.data;
  }

  /**
   * Start a task
   */
  async startTask(taskId) {
    const response = await this.client.post(`/driver/tasks/${taskId}/start`);
    return response.data;
  }

  /**
   * Complete a task with customer confirmation
   */
  async completeTask(taskId, data) {
    const response = await this.client.post(`/driver/tasks/${taskId}/complete`, data);
    return response.data;
  }

  /**
   * Cancel a task with reason
   */
  async cancelTask(taskId, reason) {
    const response = await this.client.post(`/driver/tasks/${taskId}/cancel`, { reason });
    return response.data;
  }

  /**
   * Upload evidence for a task
   */
  async uploadEvidence(taskId, formData) {
    const response = await this.client.post(
      `/driver/tasks/${taskId}/evidence`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000,
      }
    );
    return response.data;
  }

  /**
   * Get evidence for a task
   */
  async getEvidence(taskId) {
    const response = await this.client.get(`/driver/tasks/${taskId}/evidence`);
    return response.data;
  }

  /**
   * Upload signature for a task
   */
  async uploadSignature(taskId, formData) {
    const response = await this.client.post(
      `/driver/tasks/${taskId}/evidence/signature`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000,
      }
    );
    return response.data;
  }

  /**
   * Add damage record with photos
   */
  async addDamage(taskId, formData) {
    const response = await this.client.post(
      `/driver/tasks/${taskId}/damages`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000,
      }
    );
    return response.data;
  }

  /**
   * Get damages for a task
   */
  async getDamages(taskId) {
    const response = await this.client.get(`/driver/tasks/${taskId}/damages`);
    return response.data;
  }

  /**
   * Submit location updates for a task
   */
  async submitLocation(taskId, updates) {
    const response = await this.client.post(`/driver/tasks/${taskId}/location`, { updates });
    return response.data;
  }

  /**
   * Get location history for a task
   */
  async getLocationHistory(taskId) {
    const response = await this.client.get(`/driver/tasks/${taskId}/location`);
    return response.data;
  }

  /**
   * Log a recovery attempt for a task
   */
  async logRecoveryAttempt(taskId, data) {
    const response = await this.client.post(`/driver/tasks/${taskId}/recovery-attempts`, data);
    return response.data;
  }

  /**
   * Get recovery attempts for a task
   */
  async getRecoveryAttempts(taskId) {
    const response = await this.client.get(`/driver/tasks/${taskId}/recovery-attempts`);
    return response.data;
  }

  /**
   * Get task history with optional filters
   */
  async getHistory(params = {}) {
    const response = await this.client.get('/driver/tasks/history', { params });
    return response.data;
  }

  /**
   * Create a new task (admin endpoint)
   */
  async createTask(data) {
    const response = await this.client.post('/tasks', data);
    return response.data;
  }
}

export default new DriverTaskApiService();
