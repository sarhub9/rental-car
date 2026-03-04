import TenantRulesModel from '../models/tenant-rules.model.js';

class AdminSettingsController {
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
