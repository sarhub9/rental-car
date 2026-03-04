import MessageModel from '../models/message.model.js';

class MessageService {
  /**
   * Create a new message thread (customer-initiated)
   */
  async createThread(customerId, tenantId, subject, initialMessage, userId) {
    // Create thread
    const thread = await MessageModel.createThread({
      tenant_id: tenantId,
      customer_id: customerId,
      subject,
    });

    // Add initial message
    await MessageModel.createMessage({
      thread_id: thread.id,
      sender_user_id: userId,
      sender_role: 'RENTAL_CUSTOMER',
      message_text: initialMessage,
    });

    return thread;
  }

  /**
   * Get thread with messages
   */
  async getThread(threadId, tenantId) {
    const thread = await MessageModel.findThreadById(threadId, tenantId);
    if (!thread) {
      const error = new Error('Thread not found');
      error.statusCode = 404;
      throw error;
    }

    const messages = await MessageModel.getThreadMessages(threadId);
    return { ...thread, messages };
  }

  /**
   * Add message to thread
   */
  async addMessage(threadId, tenantId, userId, userRole, messageText, attachments = []) {
    const thread = await MessageModel.findThreadById(threadId, tenantId);
    if (!thread) {
      const error = new Error('Thread not found');
      error.statusCode = 404;
      throw error;
    }

    if (thread.status === 'CLOSED') {
      const error = new Error('Cannot add message to closed thread');
      error.statusCode = 400;
      throw error;
    }

    return MessageModel.createMessage({
      thread_id: threadId,
      sender_user_id: userId,
      sender_role: userRole,
      message_text: messageText,
      attachments,
    });
  }

  /**
   * Mark messages as read
   */
  async markAsRead(threadId, tenantId, userId) {
    const thread = await MessageModel.findThreadById(threadId, tenantId);
    if (!thread) {
      const error = new Error('Thread not found');
      error.statusCode = 404;
      throw error;
    }

    await MessageModel.markMessagesAsRead(threadId, userId);
  }

  /**
   * Close a thread
   */
  async closeThread(threadId, tenantId) {
    return MessageModel.updateThreadStatus(threadId, tenantId, 'CLOSED');
  }

  /**
   * Reopen a thread
   */
  async reopenThread(threadId, tenantId) {
    return MessageModel.updateThreadStatus(threadId, tenantId, 'OPEN');
  }

  /**
   * List customer threads
   */
  async getCustomerThreads(customerId, tenantId, filters = {}) {
    return MessageModel.listCustomerThreads(customerId, tenantId, filters);
  }

  /**
   * List all threads (admin)
   */
  async listThreads(tenantId, filters = {}) {
    return MessageModel.listThreads(tenantId, filters);
  }

  /**
   * Get unread message count for customer
   */
  async getCustomerUnreadCount(customerId, tenantId) {
    return MessageModel.getCustomerUnreadCount(customerId, tenantId);
  }
}

export default new MessageService();
