import VehicleDocumentService from '../services/vehicle-document.service.js';

class VehicleDocumentController {
  async upload(req, res) {
    try {
      const doc = await VehicleDocumentService.upload(
        { ...req.body, vehicle_id: req.params.vehicleId },
        req.tenantId, req.user.id
      );
      return res.status(201).json({ success: true, data: doc });
    } catch (error) {
      if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async getByVehicle(req, res) {
    try {
      const docs = await VehicleDocumentService.getByVehicle(req.params.vehicleId, req.tenantId);
      return res.status(200).json({ success: true, data: docs });
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async getById(req, res) {
    try {
      const doc = await VehicleDocumentService.getById(req.params.docId, req.tenantId);
      return res.status(200).json({ success: true, data: doc });
    } catch (error) {
      if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async update(req, res) {
    try {
      const doc = await VehicleDocumentService.update(req.params.docId, req.tenantId, req.body);
      return res.status(200).json({ success: true, data: doc });
    } catch (error) {
      if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async getExpiryAlerts(req, res) {
    try {
      const alerts = await VehicleDocumentService.getExpiryAlerts(req.tenantId);
      return res.status(200).json({ success: true, data: alerts });
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

export default new VehicleDocumentController();
