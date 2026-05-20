import MessageService from '../services/message.service.js';

class MessageController {
  /**
   * POST /v1/customer/messages
   * Create a new message thread
   */
  async createThread(req, res, next) {
    try {
      const { subject, message, message_text } = req.body;
      const body = message || message_text;
      if (!subject || !body) {
        return res.status(400).json({ error: 'subject and message are required' });
      }

      const thread = await MessageService.createThread(
        req.user.customerId,
        req.user.tenantId,
        subject,
        body,
        req.user.id,
      );
      res.status(201).json({ data: thread });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /v1/customer/messages
   * List customer's message threads
   */
  async getCustomerThreads(req, res, next) {
    try {
      const { status, limit, offset } = req.query;
      const threads = await MessageService.getCustomerThreads(req.user.customerId, req.user.tenantId, {
        status,
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
      });
      res.json({ data: threads });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /v1/customer/messages/unread-count
   * Get unread message count
   */
  async getUnreadCount(req, res, next) {
    try {
      const count = await MessageService.getCustomerUnreadCount(req.user.customerId, req.user.tenantId);
      res.json({ data: { unread_count: count } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /v1/customer/messages/:id
   * Get thread with messages
   */
  async getCustomerThread(req, res, next) {
    try {
      const thread = await MessageService.getThread(req.params.id, req.user.tenantId);

      // Ownership check
      if (thread.customer_id !== req.user.customerId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json({ data: thread });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /v1/customer/messages/:id/messages
   * Add message to thread
   */
  async addCustomerMessage(req, res, next) {
    try {
      const { message, message_text, attachments } = req.body;
      const body = message || message_text;
      if (!body) {
        return res.status(400).json({ error: 'message is required' });
      }

      // Verify ownership
      const thread = await MessageService.getThread(req.params.id, req.user.tenantId);
      if (thread.customer_id !== req.user.customerId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const newMessage = await MessageService.addMessage(
        req.params.id,
        req.user.tenantId,
        req.user.id,
        'RENTAL_CUSTOMER',
        body,
        attachments,
      );
      res.status(201).json({ data: newMessage });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /v1/customer/messages/:id/read
   * Mark thread messages as read
   */
  async markAsRead(req, res, next) {
    try {
      // Verify ownership
      const thread = await MessageService.getThread(req.params.id, req.user.tenantId);
      if (thread.customer_id !== req.user.customerId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      await MessageService.markAsRead(req.params.id, req.user.tenantId, req.user.id);
      res.json({ message: 'Messages marked as read' });
    } catch (error) {
      next(error);
    }
  }

  // ---- Admin Routes ----

  /**
   * GET /v1/messages
   * List all threads (admin)
   */
  async listThreads(req, res, next) {
    try {
      const { status, limit, offset } = req.query;
      const threads = await MessageService.listThreads(req.user.tenantId, {
        status,
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
      });
      res.json({ data: threads });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /v1/messages/:id
   * Get thread detail (admin)
   */
  async getThread(req, res, next) {
    try {
      const thread = await MessageService.getThread(req.params.id, req.user.tenantId);
      res.json({ data: thread });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /v1/messages/:id/messages
   * Add admin message to thread
   */
  async addAdminMessage(req, res, next) {
    try {
      const { message, attachments } = req.body;
      if (!message) {
        return res.status(400).json({ error: 'message is required' });
      }

      const newMessage = await MessageService.addMessage(
        req.params.id,
        req.user.tenantId,
        req.user.id,
        req.user.role,
        message,
        attachments,
      );
      res.status(201).json({ data: newMessage });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /v1/messages/:id/close
   * Close a thread
   */
  async closeThread(req, res, next) {
    try {
      const thread = await MessageService.closeThread(req.params.id, req.user.tenantId);
      res.json({ data: thread });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /v1/messages/:id/reopen
   * Reopen a thread
   */
  async reopenThread(req, res, next) {
    try {
      const thread = await MessageService.reopenThread(req.params.id, req.user.tenantId);
      res.json({ data: thread });
    } catch (error) {
      next(error);
    }
  }
}

export default new MessageController();
