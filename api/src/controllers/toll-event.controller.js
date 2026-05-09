import TollAttributionService from '../services/toll-attribution.service.js';

class TollEventController {
  async create(req, res) {
    try {
      const event = await TollAttributionService.createEvent(req.body, req.tenantId);
      return res.status(201).json({ success: true, data: event });
    } catch (error) {
      if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async bulkImport(req, res) {
    try {
      const results = await TollAttributionService.bulkImport(req.body.events || [], req.tenantId);
      return res.status(200).json({ success: true, data: results });
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async list(req, res) {
    try {
      const filters = {
        attribution_status: req.query.attribution_status,
        plate_number: req.query.plate_number,
        event_type: req.query.event_type,
        limit: parseInt(req.query.limit) || 20,
        offset: parseInt(req.query.offset) || 0,
      };
      const events = await TollAttributionService.list(req.tenantId, filters);
      return res.status(200).json({ success: true, data: events });
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async getById(req, res) {
    try {
      const event = await TollAttributionService.getById(req.params.id, req.tenantId);
      return res.status(200).json({ success: true, data: event });
    } catch (error) {
      if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async manualAttribute(req, res) {
    try {
      const event = await TollAttributionService.manualAttribute(
        req.params.id, req.tenantId,
        req.body.agreement_id, req.body.customer_id, req.user.id
      );
      return res.status(200).json({ success: true, data: event });
    } catch (error) {
      if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async waive(req, res) {
    try {
      const event = await TollAttributionService.waive(req.params.id, req.tenantId);
      return res.status(200).json({ success: true, data: event });
    } catch (error) {
      if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async getSummary(req, res) {
    try {
      const summary = await TollAttributionService.getPendingAttributionSummary(req.tenantId);
      return res.status(200).json({ success: true, data: summary });
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

export default new TollEventController();
