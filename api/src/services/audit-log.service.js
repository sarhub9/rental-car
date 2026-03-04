import pool from '../config/database.js';

/**
 * Audit Log Service
 * Records all agreement lifecycle events for compliance and debugging
 */
class AuditLogService {
  /**
   * Log an agreement event
   */
  async logEvent({
    tenantId,
    agreementId,
    eventType,
    eventDescription,
    oldStatus = null,
    newStatus = null,
    userId,
    ipAddress = null,
    userAgent = null,
    eventData = null,
  }) {
    try {
      const query = `
        INSERT INTO agreement_audit_log (
          tenant_id,
          agreement_id,
          event_type,
          event_description,
          old_status,
          new_status,
          user_id,
          ip_address,
          user_agent,
          event_data
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id, event_timestamp
      `;

      const values = [
        tenantId,
        agreementId,
        eventType,
        eventDescription,
        oldStatus,
        newStatus,
        userId,
        ipAddress,
        userAgent,
        eventData ? JSON.stringify(eventData) : null,
      ];

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Audit log error:', error);
      // Don't throw - audit logging should not break main operations
    }
  }

  /**
   * Get audit trail for an agreement
   */
  async getAuditTrail(agreementId, tenantId) {
    try {
      const query = `
        SELECT
          id,
          event_type,
          event_description,
          old_status,
          new_status,
          user_id,
          event_timestamp,
          event_data
        FROM agreement_audit_log
        WHERE agreement_id = $1 AND tenant_id = $2
        ORDER BY event_timestamp DESC
      `;

      const result = await pool.query(query, [agreementId, tenantId]);
      return result.rows;
    } catch (error) {
      console.error('Get audit trail error:', error);
      throw new Error('Failed to retrieve audit trail');
    }
  }

  /**
   * Log agreement creation
   */
  async logCreation(tenantId, agreementId, userId, ipAddress, userAgent) {
    return this.logEvent({
      tenantId,
      agreementId,
      eventType: 'CREATED',
      eventDescription: 'Rental agreement created in DRAFT status',
      newStatus: 'DRAFT',
      userId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log agreement activation
   */
  async logActivation(tenantId, agreementId, userId, ipAddress, userAgent) {
    return this.logEvent({
      tenantId,
      agreementId,
      eventType: 'ACTIVATED',
      eventDescription: 'Rental agreement activated with checkout evidence',
      oldStatus: 'DRAFT',
      newStatus: 'ACTIVE',
      userId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log agreement closure
   */
  async logClosure(tenantId, agreementId, userId, ipAddress, userAgent, charges) {
    return this.logEvent({
      tenantId,
      agreementId,
      eventType: 'CLOSED',
      eventDescription: 'Rental agreement closed with return evidence',
      oldStatus: 'ACTIVE',
      newStatus: 'CLOSED',
      userId,
      ipAddress,
      userAgent,
      eventData: { charges },
    });
  }

  async logUpdateAttempt(tenantId, agreementId, userId, ipAddress, userAgent, reason) {
    return this.logEvent({
      tenantId, agreementId,
      eventType: 'UPDATE_ATTEMPTED',
      eventDescription: `Update attempt: ${reason}`,
      userId, ipAddress, userAgent,
    });
  }

  async logSystemEvent({ tenantId, userId, action, entityType, entityId, oldValue, newValue, justification, ipAddress, userAgent }) {
    try {
      const SystemAuditLogModel = (await import('../models/system-audit-log.model.js')).default;
      return await SystemAuditLogModel.create({
        tenant_id: tenantId, user_id: userId, action, entity_type: entityType,
        entity_id: entityId, old_value: oldValue, new_value: newValue,
        justification, ip_address: ipAddress, user_agent: userAgent,
      });
    } catch (error) {
      console.error('System audit log error:', error);
    }
  }

  async logRatePlanChange(tenantId, userId, planId, oldData, newData, ipAddress, userAgent) {
    return this.logSystemEvent({
      tenantId, userId, action: 'rate_plan_update', entityType: 'rate_plan',
      entityId: planId, oldValue: oldData, newValue: newData, ipAddress, userAgent,
    });
  }

  async logDepositStateChange(tenantId, userId, depositId, oldStatus, newStatus, amount, ipAddress, userAgent) {
    return this.logSystemEvent({
      tenantId, userId, action: `deposit_${newStatus.toLowerCase()}`, entityType: 'deposit',
      entityId: depositId, oldValue: { status: oldStatus }, newValue: { status: newStatus, amount },
      ipAddress, userAgent,
    });
  }

  async logManualOverride(tenantId, userId, entityType, entityId, oldValue, newValue, justification, ipAddress, userAgent) {
    return this.logSystemEvent({
      tenantId, userId, action: 'manual_override', entityType, entityId,
      oldValue, newValue, justification, ipAddress, userAgent,
    });
  }
}

export default new AuditLogService();
