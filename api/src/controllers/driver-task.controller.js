import DriverTaskService from '../services/driver-task.service.js';
import multer from 'multer';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_PHOTO_SIZE_MB || '10') * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = (process.env.ALLOWED_PHOTO_TYPES || 'image/jpeg,image/png').split(',');
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`));
    }
  },
});

/**
 * Driver Task Controller
 * Handles HTTP requests for driver task operations and recovery workflows
 */
class DriverTaskController {
  /**
   * List tasks for the current driver
   * GET /v1/driver/tasks
   */
  async listTasks(req, res) {
    try {
      const filters = {
        date: req.query.date,
        status: req.query.status,
        type: req.query.type,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
      };

      const result = await DriverTaskService.listDriverTasks(
        req.user.id,
        req.tenantId,
        filters
      );

      return res.status(200).json({
        success: true,
        data: result.data,
        meta: result.meta,
        stats: result.stats,
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          error: error.message,
        });
      }
      console.error('List tasks error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to list driver tasks',
      });
    }
  }

  /**
   * Get task detail
   * GET /v1/driver/tasks/:taskId
   */
  async getTask(req, res) {
    try {
      const { taskId } = req.params;

      const task = await DriverTaskService.getTaskDetail(
        taskId,
        req.tenantId,
        req.user.id
      );

      return res.status(200).json({
        success: true,
        data: task,
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          error: error.message,
        });
      }
      console.error('Get task error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve task detail',
      });
    }
  }

  /**
   * Create a new driver task
   * POST /v1/tasks
   */
  async createTask(req, res) {
    try {
      const data = {
        agreement_id: req.body.agreement_id,
        vehicle_id: req.body.vehicle_id,
        customer_id: req.body.customer_id,
        assigned_driver_id: req.body.assigned_driver_id,
        task_type: req.body.task_type,
        priority: req.body.priority,
        destination_address: req.body.destination_address,
        destination_latitude: req.body.destination_latitude,
        destination_longitude: req.body.destination_longitude,
        scheduled_at: req.body.scheduled_at,
        admin_notes: req.body.admin_notes,
      };

      const task = await DriverTaskService.createTask(
        data,
        req.user.id,
        req.tenantId
      );

      return res.status(201).json({
        success: true,
        data: task,
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          error: error.message,
        });
      }
      console.error('Create task error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create driver task',
      });
    }
  }

  /**
   * Start a task
   * POST /v1/driver/tasks/:taskId/start
   */
  async startTask(req, res) {
    try {
      const { taskId } = req.params;

      const result = await DriverTaskService.startTask(
        taskId,
        req.tenantId,
        req.user.id
      );

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          error: error.message,
        });
      }
      console.error('Start task error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to start task',
      });
    }
  }

  /**
   * Upload evidence photos for a task
   * POST /v1/driver/tasks/:taskId/evidence
   */
  async uploadEvidence(req, res) {
    try {
      const { taskId } = req.params;
      const photoMetadata = req.body.photo_metadata
        ? JSON.parse(req.body.photo_metadata)
        : [];
      const odometerReading = req.body.odometer_reading
        ? parseInt(req.body.odometer_reading)
        : null;
      const fuelLevel = req.body.fuel_level || null;

      // Process uploaded photos
      const photos = [];
      if (req.files && req.files.length > 0) {
        for (let i = 0; i < req.files.length; i++) {
          const file = req.files[i];
          const metadata = photoMetadata[i] || {};

          const uploadResult = await DriverTaskService.uploadPhoto(file.buffer, {
            tenantId: req.tenantId,
            taskId,
            photoAngle: metadata.photo_angle || 'GENERAL',
          });

          photos.push({
            photo_url: uploadResult.photoUrl,
            photo_thumbnail_url: uploadResult.thumbnailUrl,
            file_size_bytes: uploadResult.fileSize,
            mime_type: file.mimetype,
            photo_angle: metadata.photo_angle || 'GENERAL',
            captured_timestamp: metadata.captured_timestamp,
            gps_latitude: metadata.gps_latitude ? parseFloat(metadata.gps_latitude) : null,
            gps_longitude: metadata.gps_longitude ? parseFloat(metadata.gps_longitude) : null,
            gps_accuracy_meters: metadata.gps_accuracy_meters ? parseFloat(metadata.gps_accuracy_meters) : null,
          });
        }
      }

      const result = await DriverTaskService.uploadEvidence(
        taskId,
        req.tenantId,
        req.user.id,
        { photos, odometer_reading: odometerReading, fuel_level: fuelLevel }
      );

      return res.status(201).json({
        success: true,
        data: {
          photos_uploaded: result.photos_uploaded,
          odometer_reading: result.odometer_reading,
          fuel_level: result.fuel_level,
        },
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          error: error.message,
        });
      }
      console.error('Upload evidence error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to upload evidence',
      });
    }
  }

  /**
   * Get evidence photos for a task
   * GET /v1/driver/tasks/:taskId/evidence
   */
  async getEvidence(req, res) {
    try {
      const { taskId } = req.params;

      const evidence = await DriverTaskService.getEvidence(
        taskId,
        req.tenantId,
        req.user.id
      );

      return res.status(200).json({
        success: true,
        data: evidence,
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          error: error.message,
        });
      }
      console.error('Get evidence error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve evidence',
      });
    }
  }

  /**
   * Upload customer signature for a task
   * POST /v1/driver/tasks/:taskId/evidence/signature
   */
  async uploadSignature(req, res) {
    try {
      const { taskId } = req.params;

      if (!req.file) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Signature file is required',
        });
      }

      const result = await DriverTaskService.uploadSignature(
        taskId,
        req.tenantId,
        req.user.id,
        req.file.buffer,
        req.file.mimetype
      );

      return res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          error: error.message,
        });
      }
      console.error('Upload signature error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to upload signature',
      });
    }
  }

  /**
   * Complete a task
   * POST /v1/driver/tasks/:taskId/complete
   */
  async completeTask(req, res) {
    try {
      const { taskId } = req.params;

      const data = {
        customer_confirmation_type: req.body.customer_confirmation_type,
        otp_code: req.body.otp_code,
        condition_notes: req.body.condition_notes,
      };

      const result = await DriverTaskService.completeTask(
        taskId,
        req.tenantId,
        req.user.id,
        data
      );

      const response = {
        success: true,
        data: result.data,
      };

      if (result.charges) {
        response.charges = result.charges;
      }

      return res.status(200).json(response);
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          error: error.message,
        });
      }
      console.error('Complete task error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to complete task',
      });
    }
  }

  /**
   * Cancel a task
   * POST /v1/driver/tasks/:taskId/cancel
   */
  async cancelTask(req, res) {
    try {
      const { taskId } = req.params;

      const result = await DriverTaskService.cancelTask(
        taskId,
        req.tenantId,
        req.user.id,
        req.body.reason
      );

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          error: error.message,
        });
      }
      console.error('Cancel task error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to cancel task',
      });
    }
  }

  /**
   * Add damage record with photos
   * POST /v1/driver/tasks/:taskId/damages
   */
  async addDamage(req, res) {
    try {
      const { taskId } = req.params;
      const photoMetadata = req.body.photo_metadata
        ? JSON.parse(req.body.photo_metadata)
        : [];

      const data = {
        description: req.body.description,
        severity: req.body.severity,
        vehicle_area: req.body.vehicle_area,
      };

      // Process uploaded damage photos
      const photos = [];
      if (req.files && req.files.length > 0) {
        for (let i = 0; i < req.files.length; i++) {
          const file = req.files[i];
          const metadata = photoMetadata[i] || {};

          const uploadResult = await DriverTaskService.uploadPhoto(file.buffer, {
            tenantId: req.tenantId,
            taskId,
            photoAngle: 'DAMAGE',
          });

          photos.push({
            photo_url: uploadResult.photoUrl,
            photo_thumbnail_url: uploadResult.thumbnailUrl,
            file_size_bytes: uploadResult.fileSize,
            mime_type: file.mimetype,
            captured_timestamp: metadata.captured_timestamp,
            gps_latitude: metadata.gps_latitude ? parseFloat(metadata.gps_latitude) : null,
            gps_longitude: metadata.gps_longitude ? parseFloat(metadata.gps_longitude) : null,
            gps_accuracy_meters: metadata.gps_accuracy_meters ? parseFloat(metadata.gps_accuracy_meters) : null,
          });
        }
      }

      const result = await DriverTaskService.addDamageRecord(
        taskId,
        req.tenantId,
        req.user.id,
        data,
        photos
      );

      return res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          error: error.message,
        });
      }
      console.error('Add damage error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to add damage record',
      });
    }
  }

  /**
   * Get damage records for a task
   * GET /v1/driver/tasks/:taskId/damages
   */
  async getDamages(req, res) {
    try {
      const { taskId } = req.params;

      const damages = await DriverTaskService.getDamageRecords(
        taskId,
        req.tenantId,
        req.user.id
      );

      return res.status(200).json({
        success: true,
        data: damages,
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          error: error.message,
        });
      }
      console.error('Get damages error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve damage records',
      });
    }
  }

  /**
   * Submit location tracking updates
   * POST /v1/driver/tasks/:taskId/location
   */
  async submitLocation(req, res) {
    try {
      const { taskId } = req.params;
      const LocationTrackingService = (await import('../services/location-tracking.service.js')).default;

      const result = await LocationTrackingService.submitBatch(
        taskId,
        req.tenantId,
        req.user.id,
        req.body.updates
      );

      return res.status(201).json({
        success: true,
        data: {
          recorded_count: result.recorded_count,
        },
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          error: error.message,
        });
      }
      console.error('Submit location error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to submit location updates',
      });
    }
  }

  /**
   * Get location history for a task
   * GET /v1/driver/tasks/:taskId/location
   */
  async getLocationHistory(req, res) {
    try {
      const { taskId } = req.params;
      const LocationTrackingService = (await import('../services/location-tracking.service.js')).default;

      const history = await LocationTrackingService.getHistory(
        taskId,
        req.tenantId,
        req.user.id
      );

      return res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          error: error.message,
        });
      }
      console.error('Get location history error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve location history',
      });
    }
  }

  /**
   * Log a recovery attempt
   * POST /v1/driver/tasks/:taskId/recovery-attempts
   */
  async logRecoveryAttempt(req, res) {
    try {
      const { taskId } = req.params;

      const data = {
        attempt_type: req.body.attempt_type,
        outcome: req.body.outcome,
        notes: req.body.notes,
      };

      const result = await DriverTaskService.logRecoveryAttempt(
        taskId,
        req.tenantId,
        req.user.id,
        data
      );

      return res.status(201).json({
        success: true,
        data: result.data,
        escalation_suggested: result.escalation_suggested,
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          error: error.message,
        });
      }
      console.error('Log recovery attempt error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to log recovery attempt',
      });
    }
  }

  /**
   * Get recovery attempts for a task
   * GET /v1/driver/tasks/:taskId/recovery-attempts
   */
  async getRecoveryAttempts(req, res) {
    try {
      const { taskId } = req.params;

      const attempts = await DriverTaskService.getRecoveryAttempts(
        taskId,
        req.tenantId,
        req.user.id
      );

      return res.status(200).json({
        success: true,
        data: attempts,
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          error: error.message,
        });
      }
      console.error('Get recovery attempts error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve recovery attempts',
      });
    }
  }

  /**
   * Get task history for the current driver
   * GET /v1/driver/tasks/history
   */
  async getHistory(req, res) {
    try {
      const filters = {
        from: req.query.from,
        to: req.query.to,
        type: req.query.type,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
      };

      const result = await DriverTaskService.getTaskHistory(
        req.user.id,
        req.tenantId,
        filters
      );

      return res.status(200).json({
        success: true,
        data: result.data,
        meta: result.meta,
        performance: result.performance,
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          error: error.message,
        });
      }
      console.error('Get history error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve task history',
      });
    }
  }
}

// Export controller instance and multer middleware
const controller = new DriverTaskController();
export const evidenceUpload = upload.array('photos', 10);
export const signatureUpload = upload.single('signature');
export const damageUpload = upload.array('photos', 5);
export default controller;
