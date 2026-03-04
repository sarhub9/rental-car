import NotificationService from '../services/notification.service.js';

class NotificationController {
  /**
   * GET /v1/customer/notifications
   * List notifications for the logged-in customer
   */
  async getNotifications(req, res, next) {
    try {
      const { limit, offset, unread_only } = req.query;
      const notifications = await NotificationService.getNotifications(
        req.user.userId,
        req.user.tenantId,
        { limit: limit ? parseInt(limit) : undefined, offset: offset ? parseInt(offset) : undefined, unread_only: unread_only === 'true' },
      );
      res.json({ data: notifications });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /v1/customer/notifications/unread-count
   * Get unread notification count
   */
  async getUnreadCount(req, res, next) {
    try {
      const count = await NotificationService.getUnreadCount(req.user.userId, req.user.tenantId);
      res.json({ data: { unread_count: count } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /v1/customer/notifications/:id/read
   * Mark a single notification as read
   */
  async markAsRead(req, res, next) {
    try {
      const notification = await NotificationService.markAsRead(req.params.id, req.user.userId);
      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      res.json({ data: notification });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /v1/customer/notifications/read-all
   * Mark all notifications as read
   */
  async markAllAsRead(req, res, next) {
    try {
      await NotificationService.markAllAsRead(req.user.userId, req.user.tenantId);
      res.json({ message: 'All notifications marked as read' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /v1/customer/devices
   * Register a device for push notifications
   */
  async registerDevice(req, res, next) {
    try {
      const { fcm_token, device_type, device_name } = req.body;
      if (!fcm_token || !device_type) {
        return res.status(400).json({ error: 'fcm_token and device_type are required' });
      }
      const device = await NotificationService.registerDevice(
        req.user.userId,
        req.user.tenantId,
        fcm_token,
        device_type,
        device_name,
      );
      res.status(201).json({ data: device });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /v1/customer/devices
   * Unregister a device
   */
  async unregisterDevice(req, res, next) {
    try {
      const { fcm_token } = req.body;
      if (!fcm_token) {
        return res.status(400).json({ error: 'fcm_token is required' });
      }
      await NotificationService.unregisterDevice(fcm_token);
      res.json({ message: 'Device unregistered' });
    } catch (error) {
      next(error);
    }
  }
}

export default new NotificationController();
