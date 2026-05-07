/**
 * Subscription Check Middleware
 * Ensures company subscription is active before processing requests
 */
import pool from '../config/database.js';

export const enforceSubscription = async (req, res, next) => {
  try {
    // Skip for public routes and super admin
    if (!req.user || !req.user.tenantId) {
      return next();
    }

    // Super admin bypasses subscription checks
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    // Get company status and subscription
    const query = `
      SELECT c.status as company_status, cs.status as subscription_status, cs.current_period_end
      FROM companies c
      LEFT JOIN company_subscriptions cs ON cs.company_id = c.id
      WHERE c.id = $1
    `;
    const result = await pool.query(query, [req.user.tenantId]);

    if (result.rows.length === 0) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Company not found',
      });
    }

    const { company_status, subscription_status, current_period_end } = result.rows[0];

    // Check if company is suspended
    if (company_status === 'SUSPENDED') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Your company account has been suspended. Please contact support.',
      });
    }

    // Check if company is cancelled
    if (company_status === 'CANCELLED') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Your company account has been cancelled.',
      });
    }

    // Allow trial companies (check if trial expired)
    if (company_status === 'TRIAL') {
      const trialEnd = result.rows[0].trial_ends_at
        ? new Date(result.rows[0].trial_ends_at)
        : null;
      if (trialEnd && trialEnd < new Date()) {
        return res.status(403).json({
          error: 'Trial Expired',
          message: 'Your trial period has expired. Please subscribe to a plan.',
        });
      }
      return next();
    }

    // Check subscription status
    if (subscription_status === 'EXPIRED' || subscription_status === 'CANCELLED') {
      return res.status(403).json({
        error: 'Subscription Expired',
        message: 'Your subscription has expired. Please renew to continue.',
      });
    }

    next();
  } catch (error) {
    console.error('Subscription check error:', error);
    next();
  }
};
