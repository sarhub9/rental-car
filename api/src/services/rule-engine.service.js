import TenantRulesModel from '../models/tenant-rules.model.js';

/**
 * Rule Engine Service
 * Calculates charges based on tenant-specific rules
 */
class RuleEngineService {
  calculateExtraKmCharge(kmDriven, kmAllowance, ratePerKm) {
    if (kmDriven <= kmAllowance) {
      return {
        amount: 0,
        calculation_basis: {
          km_driven: kmDriven,
          km_allowance: kmAllowance,
          extra_km: 0,
          rate_per_km: ratePerKm,
        },
      };
    }

    const extraKm = kmDriven - kmAllowance;
    const amount = extraKm * ratePerKm;

    return {
      amount: parseFloat(amount.toFixed(2)),
      calculation_basis: {
        km_driven: kmDriven,
        km_allowance: kmAllowance,
        extra_km: extraKm,
        rate_per_km: ratePerKm,
      },
    };
  }

  calculateFuelCharge(checkoutFuelLevel, returnFuelLevel, fuelRefillRate) {
    const fuelLevels = {
      EMPTY: 0,
      QUARTER: 0.25,
      HALF: 0.5,
      THREE_QUARTER: 0.75,
      FULL: 1.0,
    };

    const checkoutLevel = fuelLevels[checkoutFuelLevel];
    const returnLevel = fuelLevels[returnFuelLevel];

    if (returnLevel >= checkoutLevel) {
      return {
        amount: 0,
        calculation_basis: {
          checkout_fuel_level: checkoutFuelLevel,
          return_fuel_level: returnFuelLevel,
          fuel_difference: 0,
          refill_rate: fuelRefillRate,
        },
      };
    }

    const fuelDifference = checkoutLevel - returnLevel;
    const amount = fuelDifference * fuelRefillRate;

    return {
      amount: parseFloat(amount.toFixed(2)),
      calculation_basis: {
        checkout_fuel_level: checkoutFuelLevel,
        return_fuel_level: returnFuelLevel,
        fuel_difference: fuelDifference,
        refill_rate: fuelRefillRate,
      },
    };
  }

  calculateLateFee(expectedReturnDate, actualReturnDate, lateFeePerHour, gracePeriodMinutes = 0, dailyCap = null) {
    const expected = new Date(expectedReturnDate);
    const actual = new Date(actualReturnDate);

    if (actual <= expected) {
      return {
        amount: 0,
        calculation_basis: {
          expected_return: expectedReturnDate,
          actual_return: actualReturnDate,
          hours_late: 0,
          hours_after_grace: 0,
          rate_per_hour: lateFeePerHour,
          grace_period_minutes: gracePeriodMinutes,
          daily_cap: dailyCap,
        },
      };
    }

    const diffMs = actual - expected;
    const graceMs = (gracePeriodMinutes || 0) * 60 * 1000;
    const adjustedMs = diffMs - graceMs;

    if (adjustedMs <= 0) {
      return {
        amount: 0,
        calculation_basis: {
          expected_return: expectedReturnDate,
          actual_return: actualReturnDate,
          total_minutes_late: Math.ceil(diffMs / (1000 * 60)),
          hours_late: 0,
          hours_after_grace: 0,
          rate_per_hour: lateFeePerHour,
          grace_period_minutes: gracePeriodMinutes,
          daily_cap: dailyCap,
          within_grace: true,
        },
      };
    }

    const hoursAfterGrace = Math.ceil(adjustedMs / (1000 * 60 * 60));
    let amount = hoursAfterGrace * lateFeePerHour;

    if (dailyCap && dailyCap > 0) {
      amount = Math.min(amount, dailyCap);
    }

    return {
      amount: parseFloat(amount.toFixed(2)),
      calculation_basis: {
        expected_return: expectedReturnDate,
        actual_return: actualReturnDate,
        total_minutes_late: Math.ceil(diffMs / (1000 * 60)),
        hours_after_grace: hoursAfterGrace,
        rate_per_hour: lateFeePerHour,
        grace_period_minutes: gracePeriodMinutes,
        daily_cap: dailyCap,
        capped: dailyCap ? amount >= dailyCap : false,
      },
    };
  }

  flagDamageForApproval(damageDescription, estimatedCost = 0) {
    return {
      amount: parseFloat(estimatedCost.toFixed(2)),
      calculation_basis: {
        damage_description: damageDescription,
        estimated_cost: estimatedCost,
        requires_approval: true,
      },
      approval_status: 'PENDING_APPROVAL',
    };
  }

  /**
   * Get tenant-specific rules from database with hardcoded fallback
   */
  async getTenantRules(tenantId) {
    try {
      const rules = await TenantRulesModel.findByTenantId(tenantId);
      if (rules) {
        return {
          km_allowance_per_day: rules.km_allowance_per_day,
          rate_per_extra_km: parseFloat(rules.rate_per_extra_km),
          fuel_refill_rate: parseFloat(rules.fuel_refill_rate),
          late_fee_per_hour: parseFloat(rules.late_fee_per_hour),
          grace_period_minutes: rules.grace_period_minutes,
          rule_version: rules.rule_version,
        };
      }
    } catch (error) {
      console.warn('Failed to fetch tenant rules from DB, using defaults:', error.message);
    }

    // Hardcoded fallback
    return {
      km_allowance_per_day: 200,
      rate_per_extra_km: 0.5,
      fuel_refill_rate: 100.0,
      late_fee_per_hour: 10.0,
      grace_period_minutes: 30,
      rule_version: 'V1',
    };
  }
}

export default new RuleEngineService();
