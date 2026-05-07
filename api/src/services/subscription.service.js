import SubscriptionPlanModel from '../models/subscription-plan.model.js';
import CompanySubscriptionModel from '../models/company-subscription.model.js';

class SubscriptionService {
  async getPlans() {
    return await SubscriptionPlanModel.list(true);
  }

  async getPlanById(planId) {
    return await SubscriptionPlanModel.findById(planId);
  }

  async subscribe(companyId, planId) {
    const plan = await SubscriptionPlanModel.findById(planId);
    if (!plan) {
      const err = new Error('Subscription plan not found');
      err.statusCode = 404;
      throw err;
    }

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const subscription = await CompanySubscriptionModel.create({
      company_id: companyId,
      plan_id: planId,
      status: 'ACTIVE',
      current_period_start: now,
      current_period_end: periodEnd,
    });

    return { subscription, plan };
  }

  async cancelSubscription(companyId) {
    return await CompanySubscriptionModel.update(companyId, {
      cancelled_at: new Date(),
    });
  }

  async checkLimits(companyId) {
    const sub = await CompanySubscriptionModel.findByCompanyId(companyId);
    if (!sub) {
      return { allowed: false, reason: 'No active subscription' };
    }

    if (sub.status === 'CANCELLED' || sub.status === 'EXPIRED') {
      return { allowed: false, reason: `Subscription ${sub.status.toLowerCase()}` };
    }

    return {
      allowed: true,
      plan_name: sub.plan_name,
      features: sub.features,
      max_vehicles: sub.max_vehicles,
      max_users: sub.max_users,
      subscription_status: sub.status,
    };
  }

  async enforceLimits(companyId, resourceType, currentCount) {
    const limits = await this.checkLimits(companyId);

    if (!limits.allowed) {
      const err = new Error(`Subscription check failed: ${limits.reason}`);
      err.statusCode = 403;
      throw err;
    }

    if (resourceType === 'vehicle' && limits.max_vehicles && currentCount >= limits.max_vehicles) {
      const err = new Error(`Vehicle limit reached (${limits.max_vehicles}). Upgrade your plan.`);
      err.statusCode = 403;
      throw err;
    }

    if (resourceType === 'user' && limits.max_users && currentCount >= limits.max_users) {
      const err = new Error(`User limit reached (${limits.max_users}). Upgrade your plan.`);
      err.statusCode = 403;
      throw err;
    }

    return limits;
  }
}

export default new SubscriptionService();
