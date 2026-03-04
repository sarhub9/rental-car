import LocationUpdateModel from '../models/location-update.model.js';
import VehicleTaskModel from '../models/vehicle-task.model.js';

/**
 * Location Tracking Service
 * Business logic for GPS location tracking during active driver tasks
 */
class LocationTrackingService {
  /**
   * Submit a batch of location updates for a task
   */
  async submitBatch(taskId, tenantId, driverId, updates) {
    // Validate task exists and is IN_PROGRESS
    const task = await VehicleTaskModel.findById(taskId, tenantId);

    if (!task) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }

    if (task.assigned_driver_id !== driverId) {
      const error = new Error('You are not assigned to this task');
      error.statusCode = 403;
      throw error;
    }

    if (task.status !== 'IN_PROGRESS') {
      const error = new Error('Location updates only accepted for IN_PROGRESS tasks');
      error.statusCode = 409;
      throw error;
    }

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      const error = new Error('At least one location update is required');
      error.statusCode = 400;
      throw error;
    }

    if (updates.length > 50) {
      const error = new Error('Maximum 50 location updates per batch');
      error.statusCode = 400;
      throw error;
    }

    // Validate each update
    for (const update of updates) {
      if (update.latitude < -90 || update.latitude > 90) {
        const error = new Error('Invalid latitude: must be between -90 and 90');
        error.statusCode = 400;
        throw error;
      }
      if (update.longitude < -180 || update.longitude > 180) {
        const error = new Error('Invalid longitude: must be between -180 and 180');
        error.statusCode = 400;
        throw error;
      }
      if (!update.recorded_at) {
        const error = new Error('recorded_at is required for each location update');
        error.statusCode = 400;
        throw error;
      }
    }

    // Prepare updates with task and driver info
    const enrichedUpdates = updates.map((update) => ({
      ...update,
      task_id: taskId,
      driver_id: driverId,
    }));

    const recordedCount = await LocationUpdateModel.bulkCreate(enrichedUpdates, tenantId);

    return { recorded_count: recordedCount };
  }

  /**
   * Get location history for a task
   */
  async getHistory(taskId, tenantId, userId) {
    const task = await VehicleTaskModel.findById(taskId, tenantId);

    if (!task) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }

    const locations = await LocationUpdateModel.findByTaskId(taskId, tenantId);

    return locations.map((loc) => ({
      latitude: parseFloat(loc.latitude),
      longitude: parseFloat(loc.longitude),
      accuracy_meters: loc.accuracy_meters ? parseFloat(loc.accuracy_meters) : null,
      speed_kmh: loc.speed_kmh ? parseFloat(loc.speed_kmh) : null,
      recorded_at: loc.recorded_at,
    }));
  }
}

export default new LocationTrackingService();
