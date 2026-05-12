import ReservationService from '../services/reservation.service.js';

class ReservationController {
  async create(req, res) {
    try {
      const reservation = await ReservationService.create(req.body, req.tenantId, req.user.id);
      return res.status(201).json({ success: true, data: reservation });
    } catch (error) {
      if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async list(req, res) {
    try {
      const filters = {
        status: req.query.status,
        customer_id: req.query.customer_id,
        vehicle_id: req.query.vehicle_id,
        limit: parseInt(req.query.limit) || 20,
        offset: parseInt(req.query.offset) || 0,
      };
      const reservations = await ReservationService.list(req.tenantId, filters);
      return res.status(200).json({ success: true, data: reservations });
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async getById(req, res) {
    try {
      const reservation = await ReservationService.getById(req.params.id, req.tenantId);
      return res.status(200).json({ success: true, data: reservation });
    } catch (error) {
      console.error('Reservation getById error:', error.message, error.stack);
      if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
      return res.status(500).json({ error: 'Internal Server Error', detail: error.message });
    }
  }

  async update(req, res) {
    try {
      const reservation = await ReservationService.update(req.params.id, req.tenantId, req.body);
      return res.status(200).json({ success: true, data: reservation });
    } catch (error) {
      if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async confirm(req, res) {
    try {
      const reservation = await ReservationService.confirm(req.params.id, req.tenantId);
      return res.status(200).json({ success: true, data: reservation });
    } catch (error) {
      if (error.statusCode) return res.status(error.statusCode).json({ error: error.message, conflicts: error.conflicts });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async assignVehicle(req, res) {
    try {
      const reservation = await ReservationService.assignVehicle(req.params.id, req.tenantId, req.body.vehicle_id);
      return res.status(200).json({ success: true, data: reservation });
    } catch (error) {
      if (error.statusCode) return res.status(error.statusCode).json({ error: error.message, conflicts: error.conflicts });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async cancel(req, res) {
    try {
      const reservation = await ReservationService.cancel(req.params.id, req.tenantId, req.body.reason);
      return res.status(200).json({ success: true, data: reservation });
    } catch (error) {
      if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  async markNoShow(req, res) {
    try {
      const reservation = await ReservationService.markNoShow(req.params.id, req.tenantId);
      return res.status(200).json({ success: true, data: reservation });
    } catch (error) {
      if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

export default new ReservationController();
