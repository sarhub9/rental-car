import pool from '../config/database.js';
import bcrypt from 'bcrypt';
import CompanyModel from '../models/company.model.js';
import UserModel from '../models/user.model.js';
import TenantRulesModel from '../models/tenant-rules.model.js';
import SubscriptionPlanModel from '../models/subscription-plan.model.js';
import CompanySubscriptionModel from '../models/company-subscription.model.js';

class CompanyService {
  /**
   * Register a new company with first admin user
   * Creates: company + OWNER_ADMIN user + Free plan subscription + tenant rules
   */
  async register(companyData) {
    const { name, contact_email, phone_number, password } = companyData;

    // Check if company already exists
    const existing = await CompanyModel.findByEmail(contact_email);
    if (existing) {
      const err = new Error('A company with this email already exists');
      err.statusCode = 409;
      throw err;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create everything in a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Create company
      const companyQuery = `
        INSERT INTO companies (name, contact_email, phone_number)
        VALUES ($1, $2, $3) RETURNING *
      `;
      const companyResult = await client.query(companyQuery, [name, contact_email, phone_number]);
      const company = companyResult.rows[0];

      // 2. Create OWNER_ADMIN user
      const userQuery = `
        INSERT INTO users (tenant_id, full_name, email, phone_number, password_hash, role, status)
        VALUES ($1, $2, $3, $4, $5, 'OWNER_ADMIN', 'ACTIVE') RETURNING *
      `;
      const userResult = await client.query(userQuery, [
        company.id, name + ' Admin', contact_email, phone_number, passwordHash,
      ]);
      const user = userResult.rows[0];

      // 3. Create default tenant rules
      const rulesQuery = `
        INSERT INTO tenant_rules (tenant_id, km_allowance_per_day, rate_per_extra_km, fuel_refill_rate, late_fee_per_hour, grace_period_minutes)
        VALUES ($1, 200, 0.50, 100.00, 10.00, 30)
      `;
      await client.query(rulesQuery, [company.id]);

      // 4. Assign Free plan
      const planResult = await client.query(
        "SELECT id FROM subscription_plans WHERE name = 'Free' LIMIT 1"
      );
      if (planResult.rows.length > 0) {
        const subQuery = `
          INSERT INTO company_subscriptions (company_id, plan_id, status, current_period_start, current_period_end)
          VALUES ($1, $2, 'TRIAL', NOW(), NOW() + INTERVAL '14 days')
        `;
        await client.query(subQuery, [company.id, planResult.rows[0].id]);
      }

      await client.query('COMMIT');

      // Remove password hash from response
      delete user.password_hash;

      return { company, user };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async getById(companyId) {
    const query = `
      SELECT c.*,
             cs.status as subscription_status,
             cs.current_period_end as subscription_end,
             sp.name as plan_name,
             sp.features as plan_features
      FROM companies c
      LEFT JOIN company_subscriptions cs ON cs.company_id = c.id
      LEFT JOIN subscription_plans sp ON sp.id = cs.plan_id
      WHERE c.id = $1
    `;
    const result = await pool.query(query, [companyId]);
    if (result.rows.length === 0) {
      const err = new Error('Company not found');
      err.statusCode = 404;
      throw err;
    }
    return result.rows[0];
  }

  async listCompanies(filters = {}) {
    return await CompanyModel.list(filters);
  }

  async countCompanies(filters = {}) {
    return await CompanyModel.count(filters);
  }

  async updateCompany(companyId, data) {
    return await CompanyModel.update(companyId, data);
  }

  async suspendCompany(companyId) {
    // Also invalidate all user sessions by revoking refresh tokens
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await CompanyModel.updateStatus(companyId, 'SUSPENDED');

      // Revoke all refresh tokens for this tenant
      await client.query(
        `UPDATE refresh_tokens SET is_revoked = TRUE
         WHERE user_id IN (SELECT id FROM users WHERE tenant_id = $1)`,
        [companyId]
      );

      await client.query('COMMIT');
      return await CompanyModel.findById(companyId);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async activateCompany(companyId) {
    return await CompanyModel.updateStatus(companyId, 'ACTIVE');
  }

  async getUsage(companyId) {
    const queries = await Promise.all([
      pool.query('SELECT COUNT(*)::int FROM vehicles WHERE tenant_id = $1', [companyId]),
      pool.query('SELECT COUNT(*)::int FROM users WHERE tenant_id = $1 AND status = $2', [companyId, 'ACTIVE']),
      pool.query('SELECT COUNT(*)::int FROM rental_agreements WHERE tenant_id = $1', [companyId]),
      pool.query('SELECT COUNT(*)::int FROM rental_agreements WHERE tenant_id = $1 AND status = $2', [companyId, 'ACTIVE']),
    ]);

    return {
      vehicles_count: parseInt(queries[0].rows[0].count),
      users_count: parseInt(queries[1].rows[0].count),
      agreements_total: parseInt(queries[2].rows[0].count),
      agreements_active: parseInt(queries[3].rows[0].count),
    };
  }
}

export default new CompanyService();
