import DisputeModel from '../models/dispute.model.js';

class DisputeService {
  /**
   * Create a new dispute (customer-initiated)
   */
  async createDispute(data, userId, tenantId) {
    const disputeNumber = await DisputeModel.generateDisputeNumber(tenantId);

    const dispute = await DisputeModel.create({
      tenant_id: tenantId,
      dispute_number: disputeNumber,
      agreement_id: data.agreement_id,
      customer_id: data.customer_id,
      charge_id: data.charge_id,
      invoice_id: data.invoice_id,
      subject: data.subject,
      description: data.description,
    });

    // Add initial message
    await DisputeModel.addMessage({
      dispute_id: dispute.id,
      sender_user_id: userId,
      sender_role: 'RENTAL_CUSTOMER',
      message: data.description,
    });

    return dispute;
  }

  /**
   * Get dispute with messages
   */
  async getDispute(disputeId, tenantId) {
    const dispute = await DisputeModel.findById(disputeId, tenantId);
    if (!dispute) {
      const error = new Error('Dispute not found');
      error.statusCode = 404;
      throw error;
    }

    const messages = await DisputeModel.getMessages(disputeId);
    return { ...dispute, messages };
  }

  /**
   * Add message to dispute
   */
  async addMessage(disputeId, tenantId, userId, role, message, attachments) {
    const dispute = await DisputeModel.findById(disputeId, tenantId);
    if (!dispute) {
      const error = new Error('Dispute not found');
      error.statusCode = 404;
      throw error;
    }

    if (['RESOLVED', 'REJECTED'].includes(dispute.status)) {
      const error = new Error('Cannot add message to a closed dispute');
      error.statusCode = 400;
      throw error;
    }

    return DisputeModel.addMessage({
      dispute_id: disputeId,
      sender_user_id: userId,
      sender_role: role,
      message,
      attachments,
    });
  }

  /**
   * Update dispute status (admin/front desk)
   */
  async updateStatus(disputeId, tenantId, status, userId, resolutionNotes) {
    const dispute = await DisputeModel.findById(disputeId, tenantId);
    if (!dispute) {
      const error = new Error('Dispute not found');
      error.statusCode = 404;
      throw error;
    }

    const extra = {};
    if (['RESOLVED', 'REJECTED'].includes(status)) {
      extra.resolved_at = new Date();
      extra.resolved_by_user_id = userId;
      extra.resolution_notes = resolutionNotes;
    }

    const updated = await DisputeModel.updateStatus(disputeId, tenantId, status, extra);

    // Notify customer of status change
    try {
      const { default: NotificationService } = await import('./notification.service.js');
      await NotificationService.notifyDisputeUpdate(dispute.customer_id, tenantId, dispute.dispute_number, status);
    } catch (err) {
      console.warn('Notification failed (dispute update):', err.message);
    }

    return updated;
  }

  /**
   * List disputes for a customer
   */
  async getCustomerDisputes(customerId, tenantId, filters = {}) {
    return DisputeModel.listByCustomer(customerId, tenantId, filters);
  }

  /**
   * List all disputes (admin)
   */
  async listDisputes(tenantId, filters = {}) {
    return DisputeModel.list(tenantId, filters);
  }
}

export default new DisputeService();
