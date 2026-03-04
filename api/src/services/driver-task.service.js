import VehicleTaskModel from '../models/vehicle-task.model.js';
import TaskEvidenceModel from '../models/task-evidence.model.js';
import RecoveryAttemptModel from '../models/recovery-attempt.model.js';
import PhotoStorageService from './photo-storage.service.js';
import AuditLogService from './audit-log.service.js';
import NotificationService from './notification.service.js';
import pool from '../config/database.js';

/**
 * Driver Task Service
 * Core business logic for driver task lifecycle, evidence capture, and recovery operations
 */
class DriverTaskService {
  /**
   * List tasks for a driver with dashboard stats
   */
  async listDriverTasks(driverId, tenantId, filters = {}) {
    const date = filters.date || new Date().toISOString().split('T')[0];

    const [tasks, stats, total] = await Promise.all([
      VehicleTaskModel.findByDriver(driverId, tenantId, {
        date: filters.date || null,
        status: filters.status,
        type: filters.type,
        page: filters.page,
        limit: filters.limit,
      }),
      VehicleTaskModel.getDashboardStats(driverId, tenantId, date),
      VehicleTaskModel.count(tenantId, {
        assigned_driver_id: driverId,
        status: filters.status,
        task_type: filters.type,
        date: filters.date || null,
      }),
    ]);

    const limit = filters.limit || 20;
    const page = filters.page || 1;

    return {
      data: tasks,
      meta: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
      stats,
    };
  }

  /**
   * Get full task detail with evidence and attempt counts
   */
  async getTaskDetail(taskId, tenantId, userId) {
    const task = await VehicleTaskModel.findById(taskId, tenantId);

    if (!task) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }

    // Get evidence counts
    const [photosCount, damagesCount, attemptsCount] = await Promise.all([
      TaskEvidenceModel.countByTaskId(taskId, tenantId),
      this._countDamages(taskId, tenantId),
      RecoveryAttemptModel.countByTaskId(taskId, tenantId),
    ]);

    return {
      ...task,
      evidence_photos_count: photosCount,
      damages_count: damagesCount,
      recovery_attempts_count: attemptsCount,
    };
  }

  /**
   * Create a new driver task
   */
  async createTask(data, createdBy, tenantId) {
    // Validate agreement exists
    const agreementCheck = await pool.query(
      'SELECT id FROM rental_agreements WHERE id = $1 AND tenant_id = $2',
      [data.agreement_id, tenantId]
    );

    if (agreementCheck.rows.length === 0) {
      const error = new Error('Agreement not found');
      error.statusCode = 404;
      throw error;
    }

    // Validate driver exists with DRIVER_RECOVERY role
    const driverCheck = await pool.query(
      "SELECT id, full_name FROM users WHERE id = $1 AND tenant_id = $2 AND role = 'DRIVER_RECOVERY' AND status = 'ACTIVE'",
      [data.assigned_driver_id, tenantId]
    );

    if (driverCheck.rows.length === 0) {
      const error = new Error('Assigned driver not found or does not have DRIVER_RECOVERY role');
      error.statusCode = 400;
      throw error;
    }

    // Create the task
    const task = await VehicleTaskModel.create({
      tenant_id: tenantId,
      agreement_id: data.agreement_id,
      vehicle_id: data.vehicle_id,
      customer_id: data.customer_id,
      assigned_driver_id: data.assigned_driver_id,
      task_type: data.task_type,
      priority: data.priority || 'NORMAL',
      destination_address: data.destination_address,
      destination_latitude: data.destination_latitude,
      destination_longitude: data.destination_longitude,
      scheduled_at: data.scheduled_at,
      admin_notes: data.admin_notes,
      created_by: createdBy,
    });

    // Send push notification to assigned driver
    try {
      const typeLabel = data.task_type.charAt(0) + data.task_type.slice(1).toLowerCase();
      await NotificationService.sendNotification(data.assigned_driver_id, tenantId, {
        title: `New ${typeLabel} Task Assigned`,
        body: `You have a new ${typeLabel.toLowerCase()} task scheduled for ${new Date(data.scheduled_at).toLocaleString()}.`,
        data: { type: 'task_assigned', task_id: task.id, task_type: data.task_type },
        notificationType: 'TASK_ASSIGNED',
      });
    } catch (err) {
      console.warn('Failed to send task assignment notification:', err.message);
    }

    // Audit log
    await AuditLogService.logEvent({
      tenantId,
      agreementId: data.agreement_id,
      eventType: 'TASK_CREATED',
      eventDescription: `${data.task_type} task created and assigned to driver`,
      userId: createdBy,
      eventData: { task_id: task.id, task_type: data.task_type, priority: data.priority || 'NORMAL' },
    });

    // Return full detail
    return VehicleTaskModel.findById(task.id, tenantId);
  }

  /**
   * Start a task (ASSIGNED → IN_PROGRESS)
   */
  async startTask(taskId, tenantId, driverId) {
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

    if (task.status !== 'ASSIGNED') {
      const error = new Error(`Task cannot be started. Current status: ${task.status}`);
      error.statusCode = 409;
      throw error;
    }

    const updated = await VehicleTaskModel.updateStatus(taskId, tenantId, 'IN_PROGRESS', {
      started_at: new Date().toISOString(),
    });

    // Audit log
    await AuditLogService.logEvent({
      tenantId,
      agreementId: task.agreement_id,
      eventType: 'TASK_STARTED',
      eventDescription: `${task.task_type} task started by driver`,
      oldStatus: 'ASSIGNED',
      newStatus: 'IN_PROGRESS',
      userId: driverId,
      eventData: { task_id: taskId },
    });

    return VehicleTaskModel.findById(taskId, tenantId);
  }

  /**
   * Upload photo to S3 for a task
   */
  async uploadPhoto(fileBuffer, metadata) {
    return PhotoStorageService.uploadPhoto(fileBuffer, {
      tenantId: metadata.tenantId,
      agreementId: metadata.taskId,
      evidenceType: 'TASK',
      photoAngle: metadata.photoAngle,
    });
  }

  /**
   * Upload evidence (photos + readings) for a task
   */
  async uploadEvidence(taskId, tenantId, userId, evidenceData) {
    const task = await VehicleTaskModel.findById(taskId, tenantId);

    if (!task) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }

    if (task.assigned_driver_id !== userId) {
      const error = new Error('You are not assigned to this task');
      error.statusCode = 403;
      throw error;
    }

    if (task.status !== 'IN_PROGRESS') {
      const error = new Error('Evidence can only be uploaded for IN_PROGRESS tasks');
      error.statusCode = 409;
      throw error;
    }

    // Save evidence photos
    let photosUploaded = 0;
    if (evidenceData.photos && evidenceData.photos.length > 0) {
      for (const photo of evidenceData.photos) {
        await TaskEvidenceModel.create({
          tenant_id: tenantId,
          task_id: taskId,
          photo_angle: photo.photo_angle || 'FRONT',
          photo_url: photo.photo_url,
          thumbnail_url: photo.photo_thumbnail_url,
          file_size_bytes: photo.file_size_bytes,
          gps_latitude: photo.gps_latitude,
          gps_longitude: photo.gps_longitude,
          gps_accuracy_meters: photo.gps_accuracy_meters,
          captured_at: photo.captured_timestamp || new Date().toISOString(),
          captured_by_user_id: userId,
        });
        photosUploaded++;
      }
    }

    // Update odometer and fuel on the task record
    const updateFields = {};
    if (evidenceData.odometer_reading !== null && evidenceData.odometer_reading !== undefined) {
      updateFields.odometer_reading = evidenceData.odometer_reading;
    }
    if (evidenceData.fuel_level) {
      updateFields.fuel_level = evidenceData.fuel_level;
    }

    if (Object.keys(updateFields).length > 0) {
      await VehicleTaskModel.updateEvidence(taskId, tenantId, updateFields);
    }

    return {
      photos_uploaded: photosUploaded,
      odometer_reading: evidenceData.odometer_reading,
      fuel_level: evidenceData.fuel_level,
    };
  }

  /**
   * Get evidence for a task
   */
  async getEvidence(taskId, tenantId, userId) {
    const task = await VehicleTaskModel.findById(taskId, tenantId);

    if (!task) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }

    const photos = await TaskEvidenceModel.findByTaskId(taskId, tenantId);

    return {
      photos,
      odometer_reading: task.odometer_reading,
      fuel_level: task.fuel_level,
      signature_url: task.signature_url,
      customer_confirmation_type: task.customer_confirmation_type,
      customer_confirmation_at: task.customer_confirmation_at,
    };
  }

  /**
   * Upload customer signature for a task
   */
  async uploadSignature(taskId, tenantId, userId, fileBuffer, mimeType) {
    const task = await VehicleTaskModel.findById(taskId, tenantId);

    if (!task) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }

    if (task.assigned_driver_id !== userId) {
      const error = new Error('You are not assigned to this task');
      error.statusCode = 403;
      throw error;
    }

    if (task.status !== 'IN_PROGRESS') {
      const error = new Error('Signatures can only be uploaded for IN_PROGRESS tasks');
      error.statusCode = 409;
      throw error;
    }

    // Upload signature to S3
    const uploadResult = await PhotoStorageService.uploadPhoto(fileBuffer, {
      tenantId,
      agreementId: taskId,
      evidenceType: 'SIGNATURE',
      photoAngle: 'SIGNATURE',
    });

    // Update task with signature URL
    await VehicleTaskModel.updateEvidence(taskId, tenantId, {
      signature_url: uploadResult.photoUrl,
      customer_confirmation_type: 'SIGNATURE',
      customer_confirmation_at: new Date().toISOString(),
    });

    return {
      signature_url: uploadResult.photoUrl,
    };
  }

  /**
   * Complete a task (IN_PROGRESS → COMPLETED)
   */
  async completeTask(taskId, tenantId, driverId, data) {
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
      const error = new Error(`Task cannot be completed. Current status: ${task.status}`);
      error.statusCode = 409;
      throw error;
    }

    // Validate minimum evidence requirements
    const missingItems = [];
    const photoCount = await TaskEvidenceModel.countByTaskId(taskId, tenantId);
    if (photoCount < 4) {
      missingItems.push(`photos (${photoCount}/4 minimum)`);
    }
    if (!task.odometer_reading && task.odometer_reading !== 0) {
      missingItems.push('odometer_reading');
    }
    if (!task.fuel_level) {
      missingItems.push('fuel_level');
    }

    // Validate customer confirmation
    if (data.customer_confirmation_type === 'OTP') {
      if (!data.otp_code) {
        missingItems.push('otp_code (required for OTP confirmation)');
      }
    } else if (data.customer_confirmation_type === 'SIGNATURE') {
      if (!task.signature_url) {
        missingItems.push('signature (upload signature first)');
      }
    } else {
      missingItems.push('customer_confirmation_type (OTP or SIGNATURE)');
    }

    if (missingItems.length > 0) {
      const error = new Error('Missing required evidence');
      error.statusCode = 400;
      error.missing_items = missingItems;
      throw error;
    }

    // Update confirmation fields if OTP
    if (data.customer_confirmation_type === 'OTP') {
      await VehicleTaskModel.updateEvidence(taskId, tenantId, {
        customer_confirmation_type: 'OTP',
        customer_confirmation_at: new Date().toISOString(),
      });
    }

    if (data.condition_notes) {
      await VehicleTaskModel.updateEvidence(taskId, tenantId, {
        condition_notes: data.condition_notes,
      });
    }

    // Mark task as COMPLETED and immutable
    await VehicleTaskModel.updateStatus(taskId, tenantId, 'COMPLETED', {
      completed_at: new Date().toISOString(),
      is_immutable: true,
    });

    let charges = null;

    // For DELIVERY tasks, update agreement delivery_completed_at
    if (task.task_type === 'DELIVERY') {
      await pool.query(
        'UPDATE rental_agreements SET delivery_completed_at = NOW(), delivery_task_id = $1 WHERE id = $2 AND tenant_id = $3',
        [taskId, task.agreement_id, tenantId]
      );
    }

    // For PICKUP tasks, trigger auto-charge calculation
    if (task.task_type === 'PICKUP') {
      charges = await this._calculatePickupCharges(task, tenantId);

      // Update vehicle status
      const damageCount = await this._countDamages(taskId, tenantId);
      const newVehicleStatus = damageCount > 0 ? 'MAINTENANCE' : 'AVAILABLE';
      await pool.query(
        'UPDATE vehicles SET status = $1 WHERE id = $2 AND tenant_id = $3',
        [newVehicleStatus, task.vehicle_id, tenantId]
      );
    }

    // For RECOVERY tasks, update vehicle status
    if (task.task_type === 'RECOVERY') {
      await pool.query(
        "UPDATE vehicles SET status = 'AVAILABLE' WHERE id = $1 AND tenant_id = $2",
        [task.vehicle_id, tenantId]
      );
    }

    // Audit log
    await AuditLogService.logEvent({
      tenantId,
      agreementId: task.agreement_id,
      eventType: 'TASK_COMPLETED',
      eventDescription: `${task.task_type} task completed by driver`,
      oldStatus: 'IN_PROGRESS',
      newStatus: 'COMPLETED',
      userId: driverId,
      eventData: {
        task_id: taskId,
        task_type: task.task_type,
        odometer: task.odometer_reading,
        confirmation_type: data.customer_confirmation_type,
        charges: charges ? charges.length : 0,
      },
    });

    const completedTask = await VehicleTaskModel.findById(taskId, tenantId);

    return {
      data: completedTask,
      charges,
    };
  }

  /**
   * Cancel a task
   */
  async cancelTask(taskId, tenantId, userId, reason) {
    const task = await VehicleTaskModel.findById(taskId, tenantId);

    if (!task) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }

    if (!['ASSIGNED', 'IN_PROGRESS'].includes(task.status)) {
      const error = new Error(`Task cannot be cancelled. Current status: ${task.status}`);
      error.statusCode = 409;
      throw error;
    }

    if (!reason) {
      const error = new Error('Cancellation reason is required');
      error.statusCode = 400;
      throw error;
    }

    await VehicleTaskModel.updateStatus(taskId, tenantId, 'CANCELLED', {
      condition_notes: `CANCELLED: ${reason}`,
    });

    // Audit log
    await AuditLogService.logEvent({
      tenantId,
      agreementId: task.agreement_id,
      eventType: 'TASK_CANCELLED',
      eventDescription: `${task.task_type} task cancelled: ${reason}`,
      oldStatus: task.status,
      newStatus: 'CANCELLED',
      userId,
      eventData: { task_id: taskId, reason },
    });

    return VehicleTaskModel.findById(taskId, tenantId);
  }

  /**
   * Add a damage record with photos
   */
  async addDamageRecord(taskId, tenantId, userId, data, photos) {
    const task = await VehicleTaskModel.findById(taskId, tenantId);

    if (!task) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }

    if (task.assigned_driver_id !== userId) {
      const error = new Error('You are not assigned to this task');
      error.statusCode = 403;
      throw error;
    }

    if (task.status !== 'IN_PROGRESS') {
      const error = new Error('Damages can only be documented for IN_PROGRESS tasks');
      error.statusCode = 409;
      throw error;
    }

    // Create damage record
    const damageResult = await pool.query(
      `INSERT INTO task_damage_records (tenant_id, task_id, description, severity, vehicle_area)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [tenantId, taskId, data.description, data.severity, data.vehicle_area]
    );

    const damageRecord = damageResult.rows[0];

    // Save damage photos
    const savedPhotos = [];
    if (photos && photos.length > 0) {
      for (const photo of photos) {
        const photoResult = await pool.query(
          `INSERT INTO task_damage_photos (tenant_id, damage_record_id, photo_url, thumbnail_url, gps_latitude, gps_longitude, captured_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [
            tenantId,
            damageRecord.id,
            photo.photo_url,
            photo.photo_thumbnail_url,
            photo.gps_latitude || null,
            photo.gps_longitude || null,
            photo.captured_timestamp || new Date().toISOString(),
          ]
        );
        savedPhotos.push(photoResult.rows[0]);
      }
    }

    return {
      ...damageRecord,
      photos: savedPhotos,
    };
  }

  /**
   * Get damage records for a task
   */
  async getDamageRecords(taskId, tenantId, userId) {
    const task = await VehicleTaskModel.findById(taskId, tenantId);

    if (!task) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }

    // Get damage records
    const damagesResult = await pool.query(
      `SELECT * FROM task_damage_records WHERE task_id = $1 AND tenant_id = $2 ORDER BY created_at DESC`,
      [taskId, tenantId]
    );

    // Get photos for each damage
    const damages = [];
    for (const damage of damagesResult.rows) {
      const photosResult = await pool.query(
        `SELECT * FROM task_damage_photos WHERE damage_record_id = $1 AND tenant_id = $2`,
        [damage.id, tenantId]
      );
      damages.push({
        ...damage,
        photos: photosResult.rows,
      });
    }

    return damages;
  }

  /**
   * Log a recovery attempt
   */
  async logRecoveryAttempt(taskId, tenantId, userId, data) {
    const task = await VehicleTaskModel.findById(taskId, tenantId);

    if (!task) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }

    if (task.task_type !== 'RECOVERY') {
      const error = new Error('Recovery attempts can only be logged for RECOVERY tasks');
      error.statusCode = 400;
      throw error;
    }

    if (task.assigned_driver_id !== userId) {
      const error = new Error('You are not assigned to this task');
      error.statusCode = 403;
      throw error;
    }

    if (task.status !== 'IN_PROGRESS') {
      const error = new Error('Recovery attempts can only be logged for IN_PROGRESS tasks');
      error.statusCode = 409;
      throw error;
    }

    const attempt = await RecoveryAttemptModel.create({
      tenant_id: tenantId,
      task_id: taskId,
      attempt_type: data.attempt_type,
      outcome: data.outcome,
      notes: data.notes,
      attempted_by: userId,
    });

    const totalAttempts = await RecoveryAttemptModel.countByTaskId(taskId, tenantId);
    const failedOutcomes = ['NO_ANSWER', 'CUSTOMER_UNCOOPERATIVE', 'VEHICLE_NOT_FOUND'];
    const escalationSuggested = totalAttempts >= 3 && failedOutcomes.includes(data.outcome);

    // Audit log
    await AuditLogService.logEvent({
      tenantId,
      agreementId: task.agreement_id,
      eventType: 'RECOVERY_ATTEMPT',
      eventDescription: `Recovery attempt #${totalAttempts}: ${data.attempt_type} - ${data.outcome}`,
      userId,
      eventData: {
        task_id: taskId,
        attempt_type: data.attempt_type,
        outcome: data.outcome,
        total_attempts: totalAttempts,
        escalation_suggested: escalationSuggested,
      },
    });

    return {
      data: attempt,
      escalation_suggested: escalationSuggested,
    };
  }

  /**
   * Get recovery attempts for a task
   */
  async getRecoveryAttempts(taskId, tenantId, userId) {
    const task = await VehicleTaskModel.findById(taskId, tenantId);

    if (!task) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }

    return RecoveryAttemptModel.findByTaskId(taskId, tenantId);
  }

  /**
   * Get task history for a driver with performance summary
   */
  async getTaskHistory(driverId, tenantId, filters = {}) {
    const historyResult = await VehicleTaskModel.getHistory(driverId, tenantId, filters);

    const limit = filters.limit || 20;
    const page = filters.page || 1;

    // Count total for pagination
    let countQuery = `
      SELECT COUNT(*) AS total FROM vehicle_tasks
      WHERE assigned_driver_id = $1 AND tenant_id = $2 AND status = 'COMPLETED'
    `;
    const countValues = [driverId, tenantId];
    let paramCount = 3;

    if (filters.from) {
      countQuery += ` AND completed_at >= $${paramCount}`;
      countValues.push(filters.from);
      paramCount++;
    }
    if (filters.to) {
      countQuery += ` AND completed_at <= $${paramCount}`;
      countValues.push(filters.to);
      paramCount++;
    }
    if (filters.type) {
      countQuery += ` AND task_type = $${paramCount}`;
      countValues.push(filters.type);
    }

    const countResult = await pool.query(countQuery, countValues);
    const total = parseInt(countResult.rows[0].total, 10);

    // Aggregate performance
    const perf = historyResult.performance;
    const performance = {
      today: Object.values(perf).reduce((sum, p) => sum + p.today, 0),
      this_week: Object.values(perf).reduce((sum, p) => sum + p.this_week, 0),
      this_month: Object.values(perf).reduce((sum, p) => sum + p.this_month, 0),
      by_type: {
        deliveries: perf.DELIVERY ? perf.DELIVERY.this_month : 0,
        pickups: perf.PICKUP ? perf.PICKUP.this_month : 0,
        recoveries: perf.RECOVERY ? perf.RECOVERY.this_month : 0,
      },
    };

    return {
      data: historyResult.tasks,
      meta: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
      performance,
    };
  }

  /**
   * Calculate pickup auto-charges
   */
  async _calculatePickupCharges(task, tenantId) {
    try {
      // Get tenant rules
      const rulesResult = await pool.query(
        'SELECT * FROM tenant_rules WHERE tenant_id = $1',
        [tenantId]
      );

      if (rulesResult.rows.length === 0) {
        return [];
      }

      const rules = rulesResult.rows[0];
      const charges = [];

      // Get checkout evidence to compare
      const checkoutResult = await pool.query(
        'SELECT odometer_reading, fuel_level FROM checkout_evidence WHERE agreement_id = $1 AND tenant_id = $2',
        [task.agreement_id, tenantId]
      );

      if (checkoutResult.rows.length > 0) {
        const checkout = checkoutResult.rows[0];

        // Extra KM charge
        if (task.odometer_reading && checkout.odometer_reading) {
          const kmDriven = task.odometer_reading - checkout.odometer_reading;
          const agreement = await pool.query(
            'SELECT rental_start_datetime, rental_end_datetime FROM rental_agreements WHERE id = $1',
            [task.agreement_id]
          );

          if (agreement.rows.length > 0) {
            const startDate = new Date(agreement.rows[0].rental_start_datetime);
            const endDate = new Date(agreement.rows[0].rental_end_datetime);
            const rentalDays = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
            const allowedKm = rentalDays * (rules.km_allowance_per_day || 250);

            if (kmDriven > allowedKm) {
              const extraKm = kmDriven - allowedKm;
              charges.push({
                charge_type: 'EXTRA_KM',
                amount: extraKm * (rules.rate_per_extra_km || 0.5),
                description: `Extra ${extraKm} km driven (${kmDriven}km total, ${allowedKm}km allowed)`,
              });
            }
          }
        }

        // Fuel shortage charge
        const fuelLevels = { EMPTY: 0, QUARTER: 0.25, HALF: 0.5, THREE_QUARTER: 0.75, FULL: 1.0 };
        const checkoutFuel = fuelLevels[checkout.fuel_level] || 0;
        const returnFuel = fuelLevels[task.fuel_level] || 0;

        if (returnFuel < checkoutFuel) {
          const shortage = checkoutFuel - returnFuel;
          charges.push({
            charge_type: 'FUEL_SHORTAGE',
            amount: shortage * (rules.fuel_refill_rate || 100),
            description: `Fuel shortage: returned at ${task.fuel_level}, checked out at ${checkout.fuel_level}`,
          });
        }
      }

      // Damage charges
      const damageCount = await this._countDamages(task.id, tenantId);
      if (damageCount > 0) {
        charges.push({
          charge_type: 'DAMAGE',
          amount: 0,
          description: `${damageCount} damage(s) documented — amount to be assessed`,
        });
      }

      return charges;
    } catch (err) {
      console.warn('Auto-charge calculation error:', err.message);
      return [];
    }
  }

  /**
   * Count damage records for a task
   */
  async _countDamages(taskId, tenantId) {
    const result = await pool.query(
      'SELECT COUNT(*) AS total FROM task_damage_records WHERE task_id = $1 AND tenant_id = $2',
      [taskId, tenantId]
    );
    return parseInt(result.rows[0].total, 10);
  }
}

export default new DriverTaskService();
