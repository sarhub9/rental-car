import RentalAgreementModel from '../models/rental-agreement.model.js';
import AuditLogService from './audit-log.service.js';
import AvailabilityService from './availability.service.js';

class AgreementService {
  async createDraft(data, userId, tenantId, ipAddress, userAgent) {
    this.validateDates(data.rental_start_datetime, data.rental_end_datetime);

    const conflicts = await AvailabilityService.checkAvailability(
      data.vehicle_id,
      tenantId,
      data.rental_start_datetime,
      data.rental_end_datetime
    );

    if (conflicts.length > 0) {
      const error = new Error('Vehicle is not available for the selected dates');
      error.statusCode = 409;
      error.conflicts = conflicts;
      throw error;
    }

    const bookable = await AvailabilityService.isVehicleBookable(
      data.vehicle_id, tenantId, data.rental_start_datetime, data.rental_end_datetime
    );
    if (!bookable.bookable) {
      const error = new Error(bookable.reason);
      error.statusCode = 409;
      throw error;
    }

    const estimatedAmount = this.calculateEstimatedAmount(
      data.rental_start_datetime,
      data.rental_end_datetime,
      data.daily_rate,
      data.weekly_rate,
      data.monthly_rate
    );

    const agreementNumber = await RentalAgreementModel.generateAgreementNumber(tenantId);

    const snapshotFields = await this.buildSnapshotFields(data, tenantId);

    const agreement = await RentalAgreementModel.create({
      tenant_id: tenantId,
      agreement_number: agreementNumber,
      customer_id: data.customer_id,
      vehicle_id: data.vehicle_id,
      rental_start_datetime: data.rental_start_datetime,
      rental_end_datetime: data.rental_end_datetime,
      daily_rate: data.daily_rate || null,
      weekly_rate: data.weekly_rate || null,
      monthly_rate: data.monthly_rate || null,
      km_allowance_per_day: data.km_allowance_per_day || null,
      rate_per_extra_km: data.rate_per_extra_km || null,
      estimated_amount: estimatedAmount,
      created_by_user_id: userId,
      // Contract charge line-items (default 0)
      salik_charges: data.salik_charges,
      fines_charges: data.fines_charges,
      damages_charges: data.damages_charges,
      fuel_charges: data.fuel_charges,
      extra_km_charges: data.extra_km_charges,
      delivery_charges: data.delivery_charges,
      pickup_charges: data.pickup_charges,
      extra_hour_charges: data.extra_hour_charges,
      other_charges: data.other_charges,
      deposit_amount: data.deposit_amount,
      cdw_amount: data.cdw_amount,
      excess_insurance_amount: data.excess_insurance_amount,
      deposit_waiver_amount: data.deposit_waiver_amount,
      additional_remarks: data.additional_remarks,
      // Additional driver
      additional_driver_name: data.additional_driver_name,
      additional_driver_license: data.additional_driver_license,
      additional_driver_license_expiry: data.additional_driver_license_expiry,
      additional_driver_eid: data.additional_driver_eid,
      additional_driver_dob: data.additional_driver_dob,
      ...snapshotFields,
    });

    await AuditLogService.logCreation(tenantId, agreement.id, userId, ipAddress, userAgent);

    // Link the originating reservation: carry its signature into the agreement
    // and mark the reservation as checked-out + linked.
    if (data.reservation_id) {
      try {
        const ReservationService = (await import('./reservation.service.js')).default;
        const reservation = await ReservationService.getById(data.reservation_id, tenantId);

        await RentalAgreementModel.update(agreement.id, tenantId, { reservation_id: data.reservation_id });
        agreement.reservation_id = data.reservation_id;

        if (reservation?.customer_signature_url) {
          await RentalAgreementModel.setSignature(agreement.id, tenantId, reservation.customer_signature_url);
          agreement.customer_signature_url = reservation.customer_signature_url;
        }

        await ReservationService.markCheckedOut(data.reservation_id, tenantId, agreement.id);
      } catch (e) {
        console.warn('Reservation linkage failed (non-blocking):', e.message);
      }
    }

    return agreement;
  }

  async buildSnapshotFields(data, tenantId) {
    const start = new Date(data.rental_start_datetime);
    const end = new Date(data.rental_end_datetime);
    const durationDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));

    if (data.rate_plan_id) {
      try {
        const RatePlanModel = (await import('../models/rate-plan.model.js')).default;
        const plan = await RatePlanModel.findById(data.rate_plan_id, tenantId);
        if (plan) {
          return {
            rate_plan_id: plan.id,
            rate_plan_name: plan.name,
            snapshot_included_km: (plan.included_km_per_day || 200) * durationDays,
            snapshot_extra_km_rate: plan.extra_km_rate,
            snapshot_deposit_amount: plan.deposit_amount || 0,
            snapshot_fuel_policy: plan.fuel_policy,
            snapshot_late_return_rules: plan.late_return_rules,
            snapshot_add_ons: plan.add_ons,
            snapshot_terms_text: plan.terms_text,
          };
        }
      } catch (e) {
        console.warn('Rate plan lookup failed, using tenant rules fallback:', e.message);
      }
    }

    try {
      const RuleEngineService = (await import('./rule-engine.service.js')).default;
      const rules = await RuleEngineService.getTenantRules(tenantId);
      return {
        rate_plan_id: null,
        rate_plan_name: 'Default (tenant rules)',
        snapshot_included_km: (rules.km_allowance_per_day || 200) * durationDays,
        snapshot_extra_km_rate: rules.rate_per_extra_km,
        snapshot_deposit_amount: 0,
        snapshot_fuel_policy: JSON.stringify({ refill_rate: rules.fuel_refill_rate, unit: 'AED' }),
        snapshot_late_return_rules: JSON.stringify({
          grace_period_minutes: rules.grace_period_minutes,
          hourly_rate: rules.late_fee_per_hour,
          daily_cap: rules.late_fee_per_hour * 15,
        }),
        snapshot_add_ons: '[]',
        snapshot_terms_text: null,
      };
    } catch (e) {
      console.warn('Tenant rules fallback also failed:', e.message);
      return {};
    }
  }

  /**
   * Update draft agreement
   */
  async updateDraft(agreementId, data, userId, tenantId, ipAddress, userAgent) {
    // Get existing agreement
    const existing = await RentalAgreementModel.findById(agreementId, tenantId);

    if (!existing) {
      const error = new Error('Agreement not found');
      error.statusCode = 404;
      throw error;
    }

    if (existing.status !== 'DRAFT') {
      const error = new Error('Only draft agreements can be updated');
      error.statusCode = 409;
      throw error;
    }

    // Validate dates if provided
    const startDate = data.rental_start_datetime || existing.rental_start_datetime;
    const endDate = data.rental_end_datetime || existing.rental_end_datetime;
    this.validateDates(startDate, endDate);

    // Check vehicle availability if dates or vehicle changed
    if (data.vehicle_id || data.rental_start_datetime || data.rental_end_datetime) {
      const vehicleId = data.vehicle_id || existing.vehicle_id;
      const conflicts = await this.checkVehicleAvailability(
        vehicleId,
        tenantId,
        startDate,
        endDate,
        agreementId
      );

      if (conflicts.length > 0) {
        const error = new Error('Vehicle is not available for the selected dates');
        error.statusCode = 409;
        error.conflicts = conflicts;
        throw error;
      }
    }

    // Recalculate estimated amount if rates or dates changed
    if (data.daily_rate || data.weekly_rate || data.monthly_rate || data.rental_start_datetime || data.rental_end_datetime) {
      const dailyRate = data.daily_rate !== undefined ? data.daily_rate : existing.daily_rate;
      const weeklyRate = data.weekly_rate !== undefined ? data.weekly_rate : existing.weekly_rate;
      const monthlyRate = data.monthly_rate !== undefined ? data.monthly_rate : existing.monthly_rate;

      data.estimated_amount = this.calculateEstimatedAmount(startDate, endDate, dailyRate, weeklyRate, monthlyRate);
    }

    // Update agreement
    const updated = await RentalAgreementModel.update(agreementId, tenantId, data);

    if (!updated) {
      const error = new Error('Failed to update agreement');
      error.statusCode = 500;
      throw error;
    }

    // Log update
    await AuditLogService.logEvent({
      tenantId,
      agreementId,
      eventType: 'UPDATED',
      eventDescription: 'Draft agreement updated',
      userId,
      ipAddress,
      userAgent,
      eventData: { changes: Object.keys(data) },
    });

    return updated;
  }

  /**
   * Validate rental dates
   */
  validateDates(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (start >= end) {
      const error = new Error('End date must be after start date');
      error.statusCode = 400;
      throw error;
    }

    const gracePeriodMs = 60 * 60 * 1000;
    if (start.getTime() < now.getTime() - gracePeriodMs) {
      const error = new Error('Start date cannot be more than 1 hour in the past');
      error.statusCode = 400;
      throw error;
    }

    return true;
  }

  /**
   * Check vehicle availability
   */
  async checkVehicleAvailability(vehicleId, tenantId, startDate, endDate, excludeAgreementId = null) {
    return await RentalAgreementModel.checkVehicleAvailability(
      vehicleId,
      tenantId,
      startDate,
      endDate,
      excludeAgreementId
    );
  }

  /**
   * Calculate estimated rental amount
   */
  calculateEstimatedAmount(startDate, endDate, dailyRate, weeklyRate, monthlyRate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const daily = Number(dailyRate) || 0;
    const weekly = Number(weeklyRate) || 0;
    const monthly = Number(monthlyRate) || 0;

    if (!daily && !weekly && !monthly) {
      const error = new Error('Either daily_rate, weekly_rate or monthly_rate must be provided');
      error.statusCode = 400;
      throw error;
    }

    // Tiered pricing: monthly (>=30d) then weekly (>=7d) then daily for the remainder.
    let amount = 0;
    let remaining = diffDays;

    if (monthly > 0 && remaining >= 30) {
      const months = Math.floor(remaining / 30);
      amount += months * monthly;
      remaining %= 30;
    }
    if (weekly > 0 && remaining >= 7) {
      const weeks = Math.floor(remaining / 7);
      amount += weeks * weekly;
      remaining %= 7;
    }
    if (remaining > 0) {
      // Fall back to weekly/monthly per-day equivalent if no daily rate is set.
      const perDay = daily || (weekly ? weekly / 7 : monthly / 30);
      amount += remaining * perDay;
    }

    return parseFloat(amount.toFixed(2));
  }

  /**
   * Get agreement by ID
   */
  async getById(agreementId, tenantId) {
    const agreement = await RentalAgreementModel.findById(agreementId, tenantId);

    if (!agreement) {
      const error = new Error('Agreement not found');
      error.statusCode = 404;
      throw error;
    }

    return agreement;
  }

  /**
   * List agreements
   */
  async list(tenantId, filters = {}) {
    return await RentalAgreementModel.list(tenantId, filters);
  }

  /**
   * Count agreements
   */
  async count(tenantId, filters = {}) {
    return await RentalAgreementModel.count(tenantId, filters);
  }

  async activateAgreement(agreementId, tenantId, userId, ipAddress, userAgent) {
    const agreement = await RentalAgreementModel.findById(agreementId, tenantId);

    if (!agreement) {
      const error = new Error('Agreement not found');
      error.statusCode = 404;
      throw error;
    }

    if (agreement.status !== 'DRAFT') {
      const error = new Error('Only draft agreements can be activated');
      error.statusCode = 409;
      throw error;
    }

    const updated = await RentalAgreementModel.updateStatus(
      agreementId, tenantId, 'ACTIVE', new Date()
    );

    await AvailabilityService.lockVehicle(
      agreement.vehicle_id, agreementId, tenantId,
      agreement.rental_start_datetime, agreement.rental_end_datetime,
      'rental', userId
    );

    if (agreement.snapshot_deposit_amount && parseFloat(agreement.snapshot_deposit_amount) > 0) {
      try {
        const DepositService = (await import('./deposit.service.js')).default;
        await DepositService.collectDeposit(
          agreementId, tenantId, parseFloat(agreement.snapshot_deposit_amount),
          'PENDING', userId, agreement.customer_id
        );
      } catch (err) {
        console.warn('Deposit collection failed (non-blocking):', err.message);
      }
    }

    await AuditLogService.logActivation(tenantId, agreementId, userId, ipAddress, userAgent);

    try {
      const { default: NotificationService } = await import('./notification.service.js');
      await NotificationService.notifyRentalStarted(agreement.customer_id, tenantId, agreement.agreement_number);
    } catch (err) {
      console.warn('Notification failed (rental started):', err.message);
    }

    return updated;
  }

  /**
   * Set immutability flag
   */
  async setImmutability(agreementId, tenantId) {
    // Immutability is handled by database triggers
    // This method is a placeholder for any additional application-level logic
    return true;
  }

  async closeAgreement(agreementId, tenantId, userId, ipAddress, userAgent, charges) {
    const agreement = await RentalAgreementModel.findById(agreementId, tenantId);

    if (!agreement) {
      const error = new Error('Agreement not found');
      error.statusCode = 404;
      throw error;
    }

    if (agreement.status !== 'ACTIVE') {
      const error = new Error('Only active agreements can be closed');
      error.statusCode = 409;
      throw error;
    }

    const totalCharges = charges.reduce((sum, charge) => sum + parseFloat(charge.amount), 0);
    const actualAmount = parseFloat(agreement.estimated_amount) + totalCharges;

    const updated = await RentalAgreementModel.update(agreementId, tenantId, {
      status: 'CLOSED',
      return_timestamp: new Date(),
      actual_amount: parseFloat(actualAmount.toFixed(2)),
    });

    await AvailabilityService.releaseVehicleLock(agreementId, tenantId, userId);

    await AuditLogService.logClosure(tenantId, agreementId, userId, ipAddress, userAgent, charges);

    let invoice = null;
    try {
      const InvoiceService = (await import('./invoice.service.js')).default;
      invoice = await InvoiceService.generateInvoice(agreementId, tenantId, userId);
      if (invoice) {
        invoice = await InvoiceService.issueInvoice(invoice.id, tenantId);
      }
    } catch (err) {
      console.warn('Auto-invoice generation failed (non-blocking):', err.message);
    }

    try {
      const { default: NotificationService } = await import('./notification.service.js');
      await NotificationService.notifyRentalEnded(agreement.customer_id, tenantId, agreement.agreement_number);
    } catch (err) {
      console.warn('Notification failed (rental ended):', err.message);
    }

    return { ...updated, invoice };
  }

  /**
   * Calculate kilometers driven
   */
  calculateKilometersDriven(checkoutOdometer, returnOdometer) {
    if (returnOdometer < checkoutOdometer) {
      const error = new Error('Return odometer cannot be less than checkout odometer');
      error.statusCode = 400;
      throw error;
    }

    return returnOdometer - checkoutOdometer;
  }

  async generateCharges(agreementId, tenantId, checkoutEvidence, returnEvidence) {
    const RuleEngineService = (await import('./rule-engine.service.js')).default;
    const AutoGeneratedChargeModel = (await import('../models/auto-generated-charge.model.js')).default;

    const agreement = await RentalAgreementModel.findById(agreementId, tenantId);
    const charges = [];

    const hasSnapshot = agreement.snapshot_included_km != null;
    let kmAllowance, extraKmRate, fuelRefillRate, lateRules, ruleVersion;

    if (hasSnapshot) {
      kmAllowance = agreement.snapshot_included_km;
      extraKmRate = parseFloat(agreement.snapshot_extra_km_rate);
      const fuelPolicy = typeof agreement.snapshot_fuel_policy === 'string'
        ? JSON.parse(agreement.snapshot_fuel_policy) : agreement.snapshot_fuel_policy;
      fuelRefillRate = fuelPolicy?.refill_rate || 100;
      const lateRulesRaw = typeof agreement.snapshot_late_return_rules === 'string'
        ? JSON.parse(agreement.snapshot_late_return_rules) : agreement.snapshot_late_return_rules;
      lateRules = {
        hourly_rate: lateRulesRaw?.hourly_rate || 10,
        grace_period_minutes: lateRulesRaw?.grace_period_minutes || 30,
        daily_cap: lateRulesRaw?.daily_cap || null,
      };
      ruleVersion = `SNAPSHOT:${agreement.rate_plan_name || 'default'}`;
    } else {
      const rules = await RuleEngineService.getTenantRules(tenantId);
      const startDate = new Date(agreement.rental_start_datetime);
      const endDate = new Date(agreement.rental_end_datetime);
      const durationDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      kmAllowance = durationDays * rules.km_allowance_per_day;
      extraKmRate = rules.rate_per_extra_km;
      fuelRefillRate = rules.fuel_refill_rate;
      lateRules = {
        hourly_rate: rules.late_fee_per_hour,
        grace_period_minutes: rules.grace_period_minutes || 30,
        daily_cap: null,
      };
      ruleVersion = rules.rule_version;
    }

    const kmDriven = this.calculateKilometersDriven(
      checkoutEvidence.odometer_reading, returnEvidence.odometer_reading
    );

    const extraKmCharge = RuleEngineService.calculateExtraKmCharge(kmDriven, kmAllowance, extraKmRate);
    if (extraKmCharge.amount > 0) {
      charges.push(await AutoGeneratedChargeModel.create({
        tenant_id: tenantId, agreement_id: agreementId, charge_type: 'EXTRA_KM',
        calculation_basis: extraKmCharge.calculation_basis, amount: extraKmCharge.amount,
        rule_reference: 'EXTRA_KM_RULE', rule_version: ruleVersion,
        approval_status: 'AUTO_APPROVED', approved_by_user_id: null, approved_at: null,
      }));
    }

    const fuelCharge = RuleEngineService.calculateFuelCharge(
      checkoutEvidence.fuel_level, returnEvidence.fuel_level, fuelRefillRate
    );
    if (fuelCharge.amount > 0) {
      charges.push(await AutoGeneratedChargeModel.create({
        tenant_id: tenantId, agreement_id: agreementId, charge_type: 'FUEL',
        calculation_basis: fuelCharge.calculation_basis, amount: fuelCharge.amount,
        rule_reference: 'FUEL_CHARGE_RULE', rule_version: ruleVersion,
        approval_status: 'AUTO_APPROVED', approved_by_user_id: null, approved_at: null,
      }));
    }

    const lateFee = RuleEngineService.calculateLateFee(
      agreement.rental_end_datetime, new Date(),
      lateRules.hourly_rate, lateRules.grace_period_minutes, lateRules.daily_cap
    );
    if (lateFee.amount > 0) {
      charges.push(await AutoGeneratedChargeModel.create({
        tenant_id: tenantId, agreement_id: agreementId, charge_type: 'LATE_FEE',
        calculation_basis: lateFee.calculation_basis, amount: lateFee.amount,
        rule_reference: 'LATE_FEE_RULE', rule_version: ruleVersion,
        approval_status: 'AUTO_APPROVED', approved_by_user_id: null, approved_at: null,
      }));
    }

    if (returnEvidence.damage_documented && returnEvidence.damage_description) {
      const damageCharge = RuleEngineService.flagDamageForApproval(returnEvidence.damage_description, 0);
      charges.push(await AutoGeneratedChargeModel.create({
        tenant_id: tenantId, agreement_id: agreementId, charge_type: 'DAMAGE',
        calculation_basis: damageCharge.calculation_basis, amount: damageCharge.amount,
        rule_reference: 'DAMAGE_CHARGE_RULE', rule_version: ruleVersion,
        approval_status: damageCharge.approval_status, approved_by_user_id: null, approved_at: null,
      }));
    }

    return charges;
  }

  /**
   * Get detailed agreement with all related data
   */
  async getDetailedAgreement(agreementId, tenantId) {
    const agreement = await this.getById(agreementId, tenantId);
    const EvidenceService = (await import('./evidence.service.js')).default;
    const AutoGeneratedChargeModel = (await import('../models/auto-generated-charge.model.js')).default;

    const checkoutEvidence = await EvidenceService.getCheckoutEvidence(agreementId, tenantId);
    const returnEvidence = await EvidenceService.getReturnEvidence(agreementId, tenantId);
    const charges = await AutoGeneratedChargeModel.findByAgreementId(agreementId, tenantId);

    return {
      agreement,
      checkout_evidence: checkoutEvidence,
      return_evidence: returnEvidence,
      charges,
    };
  }

  /**
   * Get audit trail for agreement
   */
  async getAuditTrail(agreementId, tenantId) {
    return await AuditLogService.getAuditTrail(agreementId, tenantId);
  }

  /**
   * Get charges for agreement
   */
  async getCharges(agreementId, tenantId) {
    const AutoGeneratedChargeModel = (await import('../models/auto-generated-charge.model.js')).default;
    return await AutoGeneratedChargeModel.findByAgreementId(agreementId, tenantId);
  }
}

export default new AgreementService();
