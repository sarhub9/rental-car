import ReservationModel from '../models/reservation.model.js';
import RatePlanModel from '../models/rate-plan.model.js';

class ReservationService {
  async create(data, tenantId, userId) {
    // Validate dates
    const pickup = new Date(data.pickup_datetime);
    const returnDt = new Date(data.return_datetime);
    if (returnDt <= pickup) {
      const err = new Error('Return datetime must be after pickup datetime');
      err.statusCode = 400;
      throw err;
    }

    const reservationNumber = await ReservationModel.generateReservationNumber(tenantId);

    // Calculate estimated amount if rate plan provided
    let estimatedAmount = data.estimated_amount || null;
    if (data.rate_plan_id && !estimatedAmount) {
      const plan = await RatePlanModel.findById(data.rate_plan_id, tenantId);
      if (plan) {
        estimatedAmount = this._calcEstimate(pickup, returnDt, plan);
      }
    }

    return await ReservationModel.create({
      ...data,
      tenant_id: tenantId,
      reservation_number: reservationNumber,
      created_by_user_id: userId,
      estimated_amount: estimatedAmount,
    });
  }

  async getById(id, tenantId) {
    const reservation = await ReservationModel.findById(id, tenantId);
    if (!reservation) {
      const err = new Error('Reservation not found');
      err.statusCode = 404;
      throw err;
    }
    return reservation;
  }

  async list(tenantId, filters = {}) {
    return await ReservationModel.list(tenantId, filters);
  }

  async update(id, tenantId, data) {
    const reservation = await this.getById(id, tenantId);
    if (reservation.status !== 'DRAFT') {
      const err = new Error('Only DRAFT reservations can be updated');
      err.statusCode = 409;
      throw err;
    }
    return await ReservationModel.update(id, tenantId, data);
  }

  async confirm(id, tenantId) {
    const reservation = await this.getById(id, tenantId);
    if (reservation.status !== 'DRAFT') {
      const err = new Error('Only DRAFT reservations can be confirmed');
      err.statusCode = 409;
      throw err;
    }

    // Create availability lock if vehicle is assigned
    if (reservation.vehicle_id) {
      const conflicts = await ReservationModel.checkVehicleLocked(
        tenantId, reservation.vehicle_id,
        reservation.pickup_datetime, reservation.return_datetime
      );
      if (conflicts.length > 0) {
        const err = new Error('Vehicle is already locked by another reservation');
        err.statusCode = 409;
        err.conflicts = conflicts;
        throw err;
      }
      await ReservationModel.createLock(
        tenantId, reservation.vehicle_id, id,
        reservation.pickup_datetime, reservation.return_datetime
      );
    }

    return await ReservationModel.updateStatus(id, tenantId, 'CONFIRMED');
  }

  async assignVehicle(id, tenantId, vehicleId) {
    const reservation = await this.getById(id, tenantId);
    if (!['DRAFT', 'CONFIRMED'].includes(reservation.status)) {
      const err = new Error('Cannot assign vehicle to this reservation');
      err.statusCode = 409;
      throw err;
    }

    // Check for lock conflicts
    const conflicts = await ReservationModel.checkVehicleLocked(
      tenantId, vehicleId,
      reservation.pickup_datetime, reservation.return_datetime,
      id
    );
    if (conflicts.length > 0) {
      const err = new Error('Vehicle is locked by another reservation');
      err.statusCode = 409;
      err.conflicts = conflicts;
      throw err;
    }

    // Release old lock if exists, create new one
    await ReservationModel.releaseLock(id);
    await ReservationModel.createLock(
      tenantId, vehicleId, id,
      reservation.pickup_datetime, reservation.return_datetime
    );

    const updated = await ReservationModel.update(id, tenantId, { vehicle_id: vehicleId });
    if (!updated) {
      // If CONFIRMED, just update vehicle_id directly
      await ReservationModel.updateStatus(id, tenantId, reservation.status, {});
    }
    return await ReservationModel.findById(id, tenantId);
  }

  async cancel(id, tenantId, reason) {
    const reservation = await this.getById(id, tenantId);
    if (['CHECKED_OUT', 'CANCELLED'].includes(reservation.status)) {
      const err = new Error(`Cannot cancel a ${reservation.status} reservation`);
      err.statusCode = 409;
      throw err;
    }

    // Release any locks
    await ReservationModel.releaseLock(id);

    return await ReservationModel.updateStatus(id, tenantId, 'CANCELLED', { cancellation_reason: reason });
  }

  async markCheckedOut(id, tenantId, agreementId) {
    await ReservationModel.releaseLock(id);
    return await ReservationModel.updateStatus(id, tenantId, 'CHECKED_OUT', { agreement_id: agreementId });
  }

  async markNoShow(id, tenantId) {
    const reservation = await this.getById(id, tenantId);
    if (reservation.status !== 'CONFIRMED') {
      const err = new Error('Only CONFIRMED reservations can be marked as no-show');
      err.statusCode = 409;
      throw err;
    }
    await ReservationModel.releaseLock(id);
    return await ReservationModel.updateStatus(id, tenantId, 'NO_SHOW');
  }

  _calcEstimate(pickup, returnDt, plan) {
    const diffDays = Math.ceil((returnDt - pickup) / (1000 * 60 * 60 * 24));
    if (plan.base_weekly_rate && diffDays >= 7) {
      const weeks = Math.floor(diffDays / 7);
      const remaining = diffDays % 7;
      return parseFloat((weeks * plan.base_weekly_rate + remaining * plan.base_daily_rate).toFixed(2));
    }
    return parseFloat((diffDays * plan.base_daily_rate).toFixed(2));
  }
}

export default new ReservationService();
