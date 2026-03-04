import AgreementService from '../services/agreement.service.js';

/**
 * Agreement Controller
 * Handles HTTP requests for rental agreements
 */
class AgreementController {
  /**
   * Create new draft agreement
   * POST /agreements
   */
  async create(req, res) {
    try {
      const agreement = await AgreementService.createDraft(
        req.validatedBody,
        req.user.id,
        req.tenantId,
        req.ip,
        req.get('user-agent')
      );

      return res.status(201).json({
        success: true,
        data: agreement,
      });
    } catch (error) {
      console.error('Create agreement error:', error);

      if (error.statusCode) {
        return res.status(error.statusCode).json({
          error: error.message,
          conflicts: error.conflicts,
        });
      }

      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create agreement',
      });
    }
  }

  /**
   * Update draft agreement
   * PATCH /agreements/:id
   */
  async update(req, res) {
    try {
      const agreement = await AgreementService.updateDraft(
        req.params.id,
        req.validatedBody,
        req.user.id,
        req.tenantId,
        req.ip,
        req.get('user-agent')
      );

      return res.status(200).json({
        success: true,
        data: agreement,
      });
    } catch (error) {
      console.error('Update agreement error:', error);

      if (error.statusCode) {
        return res.status(error.statusCode).json({
          error: error.message,
          conflicts: error.conflicts,
        });
      }

      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update agreement',
      });
    }
  }

  /**
   * Get agreement by ID
   * GET /agreements/:id
   */
  async getById(req, res) {
    try {
      const agreement = await AgreementService.getById(req.params.id, req.tenantId);

      // RENTAL_CUSTOMER can only see own agreements
      if (req.user.role === 'RENTAL_CUSTOMER' && agreement.customer_id !== req.user.customerId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only view your own agreements',
        });
      }

      return res.status(200).json({
        success: true,
        data: agreement,
      });
    } catch (error) {
      console.error('Get agreement error:', error);

      if (error.statusCode) {
        return res.status(error.statusCode).json({
          error: error.message,
        });
      }

      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve agreement',
      });
    }
  }

  /**
   * List agreements
   * GET /agreements
   */
  async list(req, res) {
    try {
      const filters = {
        status: req.query.status,
        customer_id: req.query.customer_id,
        vehicle_id: req.query.vehicle_id,
        limit: parseInt(req.query.limit) || 20,
        offset: parseInt(req.query.offset) || 0,
      };

      // RENTAL_CUSTOMER can only see own agreements
      if (req.user.role === 'RENTAL_CUSTOMER') {
        filters.customer_id = req.user.customerId;
      }

      const agreements = await AgreementService.list(req.tenantId, filters);

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
      console.error('List agreements error:', error);

      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to list agreements',
      });
    }
  }
}

export default new AgreementController();
