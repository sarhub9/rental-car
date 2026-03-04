import NotificationModel from '../models/notification.model.js';

class NotificationService {
  /**
   * Send a push notification to a user
   */
  async sendNotification(userId, tenantId, { title, body, data, notificationType }) {
    // Create notification record
    const notification = await NotificationModel.create({
      tenant_id: tenantId,
      user_id: userId,
      title,
      body,
      data,
      notification_type: notificationType,
      sent_at: new Date(),
    });

    // Get device tokens and send push (Firebase)
    try {
      const devices = await NotificationModel.getActiveDeviceTokens(userId);
      if (devices.length > 0) {
        await this._sendPush(devices, { title, body, data });
      }
    } catch (error) {
      // Don't fail the operation if push fails
      console.warn('Push notification delivery failed:', error.message);
    }

    return notification;
  }

  /**
   * Register a device token for push notifications
   */
  async registerDevice(userId, tenantId, fcmToken, deviceType, deviceName) {
    return NotificationModel.registerDevice({
      user_id: userId,
      tenant_id: tenantId,
      fcm_token: fcmToken,
      device_type: deviceType,
      device_name: deviceName,
    });
  }

  /**
   * Unregister a device token
   */
  async unregisterDevice(fcmToken) {
    return NotificationModel.deactivateDevice(fcmToken);
  }

  /**
   * Get notifications for a user
   */
  async getNotifications(userId, tenantId, filters = {}) {
    return NotificationModel.list(userId, tenantId, filters);
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId) {
    return NotificationModel.markAsRead(notificationId, userId);
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId, tenantId) {
    return NotificationModel.markAllAsRead(userId, tenantId);
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId, tenantId) {
    return NotificationModel.getUnreadCount(userId, tenantId);
  }

  // ---- Notification Triggers (called from other services) ----

  /**
   * Notify customer when rental is activated
   */
  async notifyRentalStarted(customerId, tenantId, agreementNumber) {
    const user = await this._findUserByCustomerId(customerId);
    if (!user) return;

    await this.sendNotification(user.id, tenantId, {
      title: 'Rental Started',
      body: `Your rental agreement ${agreementNumber} is now active.`,
      data: { type: 'agreement_activated', agreement_number: agreementNumber },
      notificationType: 'RENTAL_STATUS',
    });
  }

  /**
   * Notify customer when rental is closed
   */
  async notifyRentalEnded(customerId, tenantId, agreementNumber) {
    const user = await this._findUserByCustomerId(customerId);
    if (!user) return;

    await this.sendNotification(user.id, tenantId, {
      title: 'Rental Completed',
      body: `Your rental ${agreementNumber} has been completed. Please review the charges.`,
      data: { type: 'agreement_closed', agreement_number: agreementNumber },
      notificationType: 'RENTAL_STATUS',
    });
  }

  /**
   * Notify customer when invoice is issued
   */
  async notifyInvoiceIssued(customerId, tenantId, invoiceNumber, amount) {
    const user = await this._findUserByCustomerId(customerId);
    if (!user) return;

    await this.sendNotification(user.id, tenantId, {
      title: 'Invoice Issued',
      body: `Invoice ${invoiceNumber} for AED ${amount} has been issued.`,
      data: { type: 'invoice_issued', invoice_number: invoiceNumber },
      notificationType: 'PAYMENT_DUE',
    });
  }

  /**
   * Notify customer of dispute status change
   */
  async notifyDisputeUpdate(customerId, tenantId, disputeNumber, status) {
    const user = await this._findUserByCustomerId(customerId);
    if (!user) return;

    await this.sendNotification(user.id, tenantId, {
      title: 'Dispute Updated',
      body: `Your dispute ${disputeNumber} has been updated to: ${status}`,
      data: { type: 'dispute_update', dispute_number: disputeNumber },
      notificationType: 'DISPUTE_UPDATE',
    });
  }

  /**
   * Send push via Firebase Cloud Messaging
   */
  async _sendPush(devices, { title, body, data }) {
    // TODO: Integrate with Firebase Admin SDK
    // For now, log the push notification
    console.log(`[PUSH] Sending to ${devices.length} device(s): ${title} - ${body}`);
  }

  /**
   * Find user by customer_id
   */
  async _findUserByCustomerId(customerId) {
    const { default: pool } = await import('../config/database.js');
    const query = 'SELECT * FROM users WHERE customer_id = $1 AND status = $2';
    const result = await pool.query(query, [customerId, 'ACTIVE']);
    return result.rows[0];
  }
}

export default new NotificationService();
