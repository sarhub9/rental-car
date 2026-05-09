import IncidentService from '../services/incident.service.js';

class IncidentController {
  async create(req, res) {
    try {
      const incident = await IncidentService.create(req.body, req.tenantId, req.user.id);
      return res.status(201).json({ success: true, data: incident });
    } catch (error) {
      if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async list(req, res) {
    try {
      const filters = {
        status: req.query.status,
        vehicle_id: req.query.vehicle_id,
        incident_type: req.query.incident_type,
        limit: parseInt(req.query.limit) || 20,
        offset: parseInt(req.query.offset) || 0,
      };
      const incidents = await IncidentService.list(req.tenantId, filters);
      return res.status(200).json({ success: true, data: incidents });
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async getById(req, res) {
    try {
      const incident = await IncidentService.getDetail(req.params.id, req.tenantId);
      return res.status(200).json({ success: true, data: incident });
    } catch (error) {
      if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async update(req, res) {
    try {
      const incident = await IncidentService.update(req.params.id, req.tenantId, req.body);
      return res.status(200).json({ success: true, data: incident });
    } catch (error) {
      if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async addPhoto(req, res) {
    try {
      const photo = await IncidentService.addPhoto(req.params.id, req.tenantId, req.body, req.user.id);
      return res.status(201).json({ success: true, data: photo });
    } catch (error) {
      if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async getPhotos(req, res) {
    try {
      const photos = await IncidentService.getPhotos(req.params.id, req.tenantId);
      return res.status(200).json({ success: true, data: photos });
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

export default new IncidentController();
