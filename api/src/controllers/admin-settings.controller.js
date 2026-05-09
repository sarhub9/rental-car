import TenantRulesModel from '../models/tenant-rules.model.js';
import pool from '../config/database.js';

class AdminSettingsController {
  async getSuperadminSettings(req, res) {
    try {
      const result = await pool.query('SELECT setting_key, setting_value FROM superadmin_settings');
      const settings = {};
      for (const row of result.rows) {
        settings[row.setting_key] = row.setting_value;
      }
      return res.json({ settings });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to load superadmin settings' });
    }
  }

  async getCompanyActivity(req, res) {
    try {
      const days = parseInt(req.query.days) || 30;
      const since = new Date();
      since.setDate(since.getDate() - days);

      const [joins, subs, requests] = await Promise.all([
        // Companies that joined
        pool.query(`
          SELECT c.id, c.name, c.contact_email, c.status, c.created_at,
                 'COMPANY_JOINED' AS event_type, NULL AS detail
          FROM companies c
          WHERE c.created_at >= $1
          ORDER BY c.created_at DESC
        `, [since]),

        // Subscriptions / plan activations
        pool.query(`
          SELECT cs.id, c.name, c.contact_email, cs.status, cs.created_at,
                 CASE
                   WHEN cs.status = 'TRIAL' THEN 'TRIAL_STARTED'
                   WHEN cs.status = 'ACTIVE' THEN 'PLAN_ACTIVATED'
                   ELSE 'SUBSCRIPTION_UPDATED'
                 END AS event_type,
                 sp.name AS detail
          FROM company_subscriptions cs
          JOIN companies c ON c.id = cs.company_id
          LEFT JOIN subscription_plans sp ON sp.id = cs.plan_id
          WHERE cs.created_at >= $1
          ORDER BY cs.created_at DESC
        `, [since]),

        // Feature requests
        pool.query(`
          SELECT id, COALESCE(company_name, 'Unknown') AS name,
                 contact_email, status, created_at,
                 'FEATURE_REQUEST' AS event_type,
                 feature_title AS detail
          FROM feature_requests
          WHERE created_at >= $1
          ORDER BY created_at DESC
        `, [since]),
      ]);

      // Combine and sort
      const events = [
        ...joins.rows,
        ...subs.rows,
        ...requests.rows,
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return res.json({ events, total: events.length });
    } catch (err) {
      console.error('Company activity error:', err);
      return res.status(500).json({ error: 'Failed to load activity' });
    }
  }

  async saveSuperadminSettings(req, res) {
    try {
      const { feature_flags, theme } = req.body;
      if (feature_flags) {
        await pool.query(
          `INSERT INTO superadmin_settings (setting_key, setting_value, updated_by)
           VALUES ('feature_flags', $1, $2)
           ON CONFLICT (setting_key) DO UPDATE SET setting_value = $1, updated_by = $2, updated_at = NOW()`,
          [JSON.stringify(feature_flags), req.user.id]
        );
      }
      if (theme) {
        await pool.query(
          `INSERT INTO superadmin_settings (setting_key, setting_value, updated_by)
           VALUES ('theme', $1, $2)
           ON CONFLICT (setting_key) DO UPDATE SET setting_value = $1, updated_by = $2, updated_at = NOW()`,
          [JSON.stringify(theme), req.user.id]
        );
      }
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to save settings' });
    }
  }

  async getSettings(req, res) {
    try {
      let settings = await TenantRulesModel.findByTenantId(req.tenantId);

      if (!settings) {
        // Create default settings for this tenant
        settings = await TenantRulesModel.create({ tenant_id: req.tenantId });
      }

      return res.status(200).json({
        success: true,
        data: settings,
      });
    } catch (error) {
      console.error('Get settings error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to load settings',
      });
    }
  }

  async updateSettings(req, res) {
    try {
      let settings = await TenantRulesModel.findByTenantId(req.tenantId);

      if (!settings) {
        // Create with provided overrides
        settings = await TenantRulesModel.create({
          tenant_id: req.tenantId,
          ...req.validatedBody,
        });
      } else {
        settings = await TenantRulesModel.update(req.tenantId, req.validatedBody);
      }

      return res.status(200).json({
        success: true,
        data: settings,
      });
    } catch (error) {
      if (error.message === 'No fields to update') {
        return res.status(400).json({ error: 'No fields to update' });
      }
      console.error('Update settings error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update settings',
      });
    }
  }
}

export default new AdminSettingsController();
