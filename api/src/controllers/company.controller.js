import CompanyService from '../services/company.service.js';
import SubscriptionService from '../services/subscription.service.js';
import SubscriptionPlanModel from '../models/subscription-plan.model.js';
import { generateToken } from '../middleware/auth.middleware.js';

const JWT_EXPIRY_SECONDS = parseInt(process.env.JWT_EXPIRY_SECONDS || '1800', 10);

/**
 * POST /v1/companies/register
 * Public endpoint for company registration
 */
async function register(req, res) {
  try {
    const { name, contact_email, phone_number, password } = req.validatedBody;

    // Validate password
    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters',
      });
    }

    const result = await CompanyService.register({
      name, contact_email, phone_number, password,
    });

    // Generate JWT for the new admin user
    const token = generateToken(
      result.user.id,
      result.company.id,
      result.user.role,
      result.user.email,
      null
    );

    return res.status(201).json({
      success: true,
      data: {
        company: {
          id: result.company.id,
          name: result.company.name,
          contact_email: result.company.contact_email,
          status: result.company.status,
          trial_ends_at: result.company.trial_ends_at,
        },
        user: {
          id: result.user.id,
          tenant_id: result.company.id,
          role: result.user.role,
          full_name: result.user.full_name,
          email: result.user.email,
          phone_number: result.user.phone_number,
        },
        access_token: token,
        expires_in: JWT_EXPIRY_SECONDS,
      },
    });
  } catch (error) {
    console.error('Company registration error:', error);
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Registration failed. Please try again.',
    });
  }
}

/**
 * GET /v1/companies/plans
 * Public - List subscription plans
 */
async function getPlans(req, res) {
  try {
    const plans = await SubscriptionService.getPlans();
    return res.status(200).json({
      success: true,
      data: plans,
    });
  } catch (error) {
    console.error('Get plans error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription plans',
    });
  }
}

/**
 * GET /v1/companies/me
 * Get current company profile
 */
async function getMyCompany(req, res) {
  try {
    const company = await CompanyService.getById(req.user.tenantId);
    return res.status(200).json({
      success: true,
      data: company,
    });
  } catch (error) {
    console.error('Get my company error:', error);
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch company profile',
    });
  }
}

/**
 * PATCH /v1/companies/me
 * Update current company profile
 */
async function updateMyCompany(req, res) {
  try {
    const company = await CompanyService.updateCompany(req.user.tenantId, req.validatedBody);
    return res.status(200).json({
      success: true,
      data: company,
    });
  } catch (error) {
    console.error('Update company error:', error);
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to update company profile',
    });
  }
}

/**
 * POST /v1/companies/subscribe
 * Subscribe to a plan
 */
async function subscribe(req, res) {
  try {
    const { plan_id } = req.validatedBody;
    const result = await SubscriptionService.subscribe(req.user.tenantId, plan_id);

    return res.status(200).json({
      success: true,
      data: {
        subscription: result.subscription,
        plan: result.plan,
      },
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Subscription failed',
    });
  }
}

/**
 * GET /v1/super-admin/companies
 * SUPER_ADMIN - List all companies
 */
async function listCompanies(req, res) {
  try {
    const { status, limit, offset } = req.query;
    const companies = await CompanyService.listCompanies({ status, limit: limit ? parseInt(limit) : undefined, offset: offset ? parseInt(offset) : undefined });
    const count = await CompanyService.countCompanies({ status });
    return res.status(200).json({
      success: true,
      data: companies,
      count,
    });
  } catch (error) {
    console.error('List companies error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch companies',
    });
  }
}

/**
 * GET /v1/super-admin/companies/:id
 * SUPER_ADMIN - Get company details
 */
async function getCompanyById(req, res) {
  try {
    const company = await CompanyService.getById(req.params.id);

    // Get usage stats
    const usage = await CompanyService.getUsage(req.params.id);

    return res.status(200).json({
      success: true,
      data: { ...company, usage },
    });
  } catch (error) {
    console.error('Get company error:', error);
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch company details',
    });
  }
}

/**
 * PATCH /v1/super-admin/companies/:id/status
 * SUPER_ADMIN - Update company status (suspend/activate)
 */
async function updateCompanyStatus(req, res) {
  try {
    const { status } = req.body;
    if (!['ACTIVE', 'SUSPENDED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be ACTIVE, SUSPENDED, or CANCELLED',
      });
    }

    let company;
    if (status === 'SUSPENDED') {
      company = await CompanyService.suspendCompany(req.params.id);
    } else {
      company = await CompanyService.activateCompany(req.params.id);
    }

    return res.status(200).json({
      success: true,
      data: company,
    });
  } catch (error) {
    console.error('Update company status error:', error);
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to update company status',
    });
  }
}

// ── Plan Management (SUPER_ADMIN) ─────────────────────────────────────────

async function createPlan(req, res) {
  try {
    const { name, description, price_monthly, price_annual, max_vehicles, max_users, max_agreements_per_month, features, sort_order } = req.body;
    if (!name || price_monthly === undefined) {
      return res.status(400).json({ error: 'name and price_monthly are required' });
    }
    const plan = await SubscriptionPlanModel.create({
      name, description, price_monthly, price_annual,
      max_vehicles: max_vehicles || null,
      max_users: max_users || null,
      max_agreements_per_month: max_agreements_per_month || null,
      features: features || {},
      is_active: true,
      sort_order: sort_order || 0,
    });
    return res.status(201).json({ success: true, data: plan });
  } catch (err) {
    console.error('Create plan error:', err);
    return res.status(500).json({ error: 'Failed to create plan' });
  }
}

async function updatePlan(req, res) {
  try {
    const plan = await SubscriptionPlanModel.update(req.params.id, req.body);
    if (!plan) return res.status(404).json({ error: 'Plan not found' });
    return res.json({ success: true, data: plan });
  } catch (err) {
    console.error('Update plan error:', err);
    return res.status(500).json({ error: 'Failed to update plan' });
  }
}

async function togglePlanStatus(req, res) {
  try {
    const plan = await SubscriptionPlanModel.findById(req.params.id);
    if (!plan) return res.status(404).json({ error: 'Plan not found' });
    const updated = await SubscriptionPlanModel.update(req.params.id, { is_active: !plan.is_active });
    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to toggle plan status' });
  }
}

async function getAllPlans(req, res) {
  try {
    const plans = await SubscriptionPlanModel.list(false); // include inactive
    return res.json({ success: true, data: plans });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch plans' });
  }
}

export {
  register,
  getPlans,
  getMyCompany,
  updateMyCompany,
  subscribe,
  listCompanies,
  getCompanyById,
  updateCompanyStatus,
  createPlan,
  updatePlan,
  togglePlanStatus,
  getAllPlans,
};
