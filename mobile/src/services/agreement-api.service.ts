import apiClient from './api-client';

/**
 * Agreement API Service
 * Handles all API calls related to rental agreements
 */
class AgreementApiService {
  private client = apiClient;

  /**
   * Create draft rental agreement
   */
  async createAgreement(data) {
    const response = await this.client.post('/agreements', data);
    return response.data;
  }

  /**
   * Update draft agreement
   */
  async updateAgreement(agreementId, data) {
    const response = await this.client.patch(`/agreements/${agreementId}`, data);
    return response.data;
  }

  /**
   * Get agreement by ID
   */
  async getAgreement(agreementId) {
    const response = await this.client.get(`/agreements/${agreementId}`);
    return response.data;
  }

  /**
   * List agreements
   */
  async listAgreements(params = {}) {
    const response = await this.client.get('/agreements', { params });
    return response.data;
  }

  /**
   * Upload checkout evidence
   */
  async uploadCheckoutEvidence(agreementId, formData) {
    const response = await this.client.post(
      `/agreements/${agreementId}/checkout`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 seconds for photo upload
      }
    );
    return response.data;
  }

  /**
   * Upload return evidence
   */
  async uploadReturnEvidence(agreementId, formData) {
    const response = await this.client.post(
      `/agreements/${agreementId}/return`,
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
   * Get evidence for agreement
   */
  async getEvidence(agreementId) {
    const response = await this.client.get(`/agreements/${agreementId}/evidence`);
    return response.data;
  }

  /**
   * Get charges for agreement
   */
  async getCharges(agreementId) {
    const response = await this.client.get(`/agreements/${agreementId}/charges`);
    return response.data;
  }
}

export default new AgreementApiService();
