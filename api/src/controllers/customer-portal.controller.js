import CustomerPortalService from '../services/customer-portal.service.js';
import UserService from '../services/user.service.js';

class CustomerPortalController {
  /**
   * Get customer dashboard data
   * GET /customer/dashboard
   */
  async getDashboard(req, res) {
    try {
      const data = await CustomerPortalService.getDashboardData(
        req.user.customerId,
        req.tenantId
      );

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      console.error('Get dashboard error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to load dashboard',
      });
    }
  }

  /**
   * Get customer's agreements
   * GET /customer/agreements
   */
  async getAgreements(req, res) {
    try {
      const filters = {
        status: req.query.status,
        search: req.query.search,
        limit: parseInt(req.query.limit) || 20,
        offset: parseInt(req.query.offset) || 0,
      };

      const agreements = await CustomerPortalService.getMyAgreements(
        req.user.customerId,
        req.tenantId,
        filters
      );

      return res.status(200).json({
        success: true,
        data: agreements,
        pagination: {
          limit: filters.limit,
          offset: filters.offset,
          total: agreements.length,
        },
      });
    } catch (error) {
      console.error('Get agreements error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to load agreements',
      });
    }
  }

  /**
   * Get agreement detail
   * GET /customer/agreements/:id
   */
  async getAgreementDetail(req, res) {
    try {
      const agreement = await CustomerPortalService.getAgreementDetail(
        req.params.id,
        req.user.customerId,
        req.tenantId
      );

      return res.status(200).json({
        success: true,
        data: agreement,
      });
    } catch (error) {
      console.error('Get agreement detail error:', error);

      if (error.statusCode) {
        return res.status(error.statusCode).json({
          error: error.message,
        });
      }

      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to load agreement detail',
      });
    }
  }

  /**
   * Get agreement evidence
   * GET /customer/agreements/:id/evidence
   */
  async getAgreementEvidence(req, res) {
    try {
      const evidence = await CustomerPortalService.getAgreementEvidence(
        req.params.id,
        req.user.customerId,
        req.tenantId
      );

      return res.status(200).json({
        success: true,
        data: evidence,
      });
    } catch (error) {
      console.error('Get evidence error:', error);

      if (error.statusCode) {
        return res.status(error.statusCode).json({
          error: error.message,
        });
      }

      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to load evidence',
      });
    }
  }

  /**
   * Get agreement charges
   * GET /customer/agreements/:id/charges
   */
  async getAgreementCharges(req, res) {
    try {
      const charges = await CustomerPortalService.getAgreementCharges(
        req.params.id,
        req.user.customerId,
        req.tenantId
      );

      return res.status(200).json({
        success: true,
        data: charges,
      });
    } catch (error) {
      console.error('Get charges error:', error);

      if (error.statusCode) {
        return res.status(error.statusCode).json({
          error: error.message,
        });
      }

      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to load charges',
      });
    }
  }

  /**
   * Get customer profile
   * GET /customer/profile
   */
  async getProfile(req, res) {
    try {
      const profile = await UserService.getProfile(req.user.id, req.tenantId);

      return res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      console.error('Get profile error:', error);

      if (error.statusCode) {
        return res.status(error.statusCode).json({
          error: error.message,
        });
      }

      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to load profile',
      });
    }
  }

  /**
   * Update customer profile
   * PATCH /customer/profile
   */
  async updateProfile(req, res) {
    try {
      const profile = await UserService.updateProfile(
        req.user.id,
        req.tenantId,
        req.body
      );

      return res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      console.error('Update profile error:', error);

      if (error.statusCode) {
        return res.status(error.statusCode).json({
          error: error.message,
        });
      }

      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update profile',
      });
    }
  }
}

export default new CustomerPortalController();
