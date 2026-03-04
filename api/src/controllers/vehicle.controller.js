import VehicleService from '../services/vehicle.service.js';

class VehicleController {
  async create(req, res) {
    try {
      const data = {
        ...req.validatedBody,
        tenant_id: req.tenantId,
      };

      const vehicle = await VehicleService.create(data);

      return res.status(201).json({
        success: true,
        data: vehicle,
      });
    } catch (error) {
      console.error('Create vehicle error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: error.message,
      });
    }
  }

  async getById(req, res) {
    try {
      const vehicle = await VehicleService.getById(req.params.id, req.tenantId);
      return res.status(200).json({ success: true, data: vehicle });
    } catch (error) {
      const status = error.message === 'Vehicle not found' ? 404 : 500;
      return res.status(status).json({
        error: status === 404 ? 'Not Found' : 'Internal Server Error',
        message: error.message,
      });
    }
  }

  async list(req, res) {
    try {
      const filters = {
        status: req.query.status,
        category_id: req.query.category_id,
        limit: req.query.limit ? parseInt(req.query.limit) : 50,
        offset: req.query.offset ? parseInt(req.query.offset) : 0,
      };

      const vehicles = await VehicleService.list(req.tenantId, filters);
      return res.status(200).json({ success: true, data: vehicles });
    } catch (error) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to list vehicles',
      });
    }
  }

  async searchAvailable(req, res) {
    try {
      const { start_date, end_date } = req.query;
      const vehicles = await VehicleService.searchAvailable(req.tenantId, start_date, end_date);
      return res.status(200).json({ success: true, data: vehicles });
    } catch (error) {
      const status = error.message.includes('required') || error.message.includes('after') ? 400 : 500;
      return res.status(status).json({
        error: status === 400 ? 'Validation Error' : 'Internal Server Error',
        message: error.message,
      });
    }
  }

  async update(req, res) {
    try {
      const vehicle = await VehicleService.update(req.params.id, req.tenantId, req.validatedBody);
      return res.status(200).json({ success: true, data: vehicle });
    } catch (error) {
      const status = error.message === 'Vehicle not found' ? 404 : 500;
      return res.status(status).json({
        error: status === 404 ? 'Not Found' : 'Internal Server Error',
        message: error.message,
      });
    }
  }
}

export default new VehicleController();
