import DepositModel from '../models/deposit.model.js';

class DepositService {
  async collectDeposit(agreementId, tenantId, amount, paymentMethod, userId, customerId) {
    const collectedAt = new Date();
    const policyDelayDays = 7;
    const releaseEligibleAt = new Date(collectedAt);
    releaseEligibleAt.setDate(releaseEligibleAt.getDate() + policyDelayDays);

    const deposit = await DepositModel.create({
      tenant_id: tenantId,
      agreement_id: agreementId,
      customer_id: customerId,
      amount,
      status: 'HELD',
      collected_at: collectedAt,
      policy_delay_days: policyDelayDays,
      release_eligible_at: releaseEligibleAt,
      payment_method: paymentMethod,
      processed_by_user_id: userId,
    });

    try {
      const AuditLogService = (await import('./audit-log.service.js')).default;
      await AuditLogService.logSystemEvent({
        tenantId, userId,
        action: 'deposit_collected', entityType: 'deposit', entityId: deposit.id,
        newValue: { amount, status: 'HELD', agreement_id: agreementId },
      });
    } catch (e) { /* non-blocking */ }

    return deposit;
  }

  async useDeposit(depositId, tenantId, amountToUse, reason, userId) {
    const deposit = await DepositModel.findById(depositId, tenantId);
    if (!deposit) throw Object.assign(new Error('Deposit not found'), { statusCode: 404 });

    const available = parseFloat(deposit.amount) - parseFloat(deposit.amount_used);
    const actualUse = Math.min(amountToUse, available);
    const newAmountUsed = parseFloat(deposit.amount_used) + actualUse;
    const fullyUsed = newAmountUsed >= parseFloat(deposit.amount);

    const updated = await DepositModel.updateStatus(depositId, tenantId, 'USED', {
      amount_used: newAmountUsed,
      notes: reason,
      processed_by_user_id: userId,
    });

    try {
      const AuditLogService = (await import('./audit-log.service.js')).default;
      await AuditLogService.logSystemEvent({
        tenantId, userId,
        action: 'deposit_used', entityType: 'deposit', entityId: depositId,
        oldValue: { status: deposit.status, amount_used: deposit.amount_used },
        newValue: { status: 'USED', amount_used: newAmountUsed, used_now: actualUse, reason },
      });
    } catch (e) { /* non-blocking */ }

    return updated;
  }

  async releaseDeposit(depositId, tenantId, userId) {
    const deposit = await DepositModel.findById(depositId, tenantId);
    if (!deposit) throw Object.assign(new Error('Deposit not found'), { statusCode: 404 });

    if (deposit.release_eligible_at && new Date(deposit.release_eligible_at) > new Date()) {
      throw Object.assign(
        new Error(`Deposit not eligible for release until ${deposit.release_eligible_at}`),
        { statusCode: 409 }
      );
    }

    const releaseAmount = parseFloat(deposit.amount) - parseFloat(deposit.amount_used);
    const updated = await DepositModel.updateStatus(depositId, tenantId, 'RELEASED', {
      amount_released: releaseAmount,
      released_at: new Date(),
      processed_by_user_id: userId,
    });

    try {
      const AuditLogService = (await import('./audit-log.service.js')).default;
      await AuditLogService.logSystemEvent({
        tenantId, userId,
        action: 'deposit_released', entityType: 'deposit', entityId: depositId,
        oldValue: { status: deposit.status }, newValue: { status: 'RELEASED', amount_released: releaseAmount },
      });
    } catch (e) { /* non-blocking */ }

    return updated;
  }

  async forfeitDeposit(depositId, tenantId, justification, userId) {
    const deposit = await DepositModel.findById(depositId, tenantId);
    if (!deposit) throw Object.assign(new Error('Deposit not found'), { statusCode: 404 });

    const updated = await DepositModel.updateStatus(depositId, tenantId, 'FORFEITED', {
      forfeited_at: new Date(),
      notes: justification,
      processed_by_user_id: userId,
    });

    try {
      const AuditLogService = (await import('./audit-log.service.js')).default;
      await AuditLogService.logSystemEvent({
        tenantId, userId,
        action: 'deposit_forfeited', entityType: 'deposit', entityId: depositId,
        oldValue: { status: deposit.status }, newValue: { status: 'FORFEITED', justification },
      });
    } catch (e) { /* non-blocking */ }

    return updated;
  }

  async refundDeposit(depositId, tenantId, userId) {
    const updated = await DepositModel.updateStatus(depositId, tenantId, 'REFUNDED', {
      refunded_at: new Date(),
      processed_by_user_id: userId,
    });

    try {
      const AuditLogService = (await import('./audit-log.service.js')).default;
      await AuditLogService.logSystemEvent({
        tenantId, userId,
        action: 'deposit_refunded', entityType: 'deposit', entityId: depositId,
        newValue: { status: 'REFUNDED' },
      });
    } catch (e) { /* non-blocking */ }

    return updated;
  }

  async getDepositsForRelease(tenantId) {
    return DepositModel.getDepositsForRelease(tenantId);
  }

  async findByAgreementId(agreementId, tenantId) {
    return DepositModel.findByAgreementId(agreementId, tenantId);
  }
}

export default new DepositService();
