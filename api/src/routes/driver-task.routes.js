import express from 'express';
import DriverTaskController, { evidenceUpload, signatureUpload, damageUpload } from '../controllers/driver-task.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { enforceTenantIsolation } from '../middleware/tenant-isolation.middleware.js';
import { uploadRateLimiter } from '../middleware/rate-limit.middleware.js';

// Driver-facing routes
const driverRouter = express.Router();

// Apply authentication and tenant isolation to all driver routes
driverRouter.use(authenticate);
driverRouter.use(enforceTenantIsolation);

/**
 * @route   GET /v1/driver/tasks/history
 * @desc    Get task history for the current driver
 * @access  Driver/Recovery
 */
driverRouter.get(
  '/tasks/history',
  requireRole('DRIVER_RECOVERY'),
  DriverTaskController.getHistory
);

/**
 * @route   GET /v1/driver/tasks
 * @desc    List tasks for the current driver
 * @access  Driver/Recovery
 */
driverRouter.get(
  '/tasks',
  requireRole('DRIVER_RECOVERY'),
  DriverTaskController.listTasks
);

/**
 * @route   GET /v1/driver/tasks/:taskId
 * @desc    Get task detail
 * @access  Driver/Recovery, Admin, Fleet Manager
 */
driverRouter.get(
  '/tasks/:taskId',
  requireRole('DRIVER_RECOVERY', 'OWNER_ADMIN', 'FLEET_MANAGER'),
  DriverTaskController.getTask
);

/**
 * @route   POST /v1/driver/tasks/:taskId/start
 * @desc    Start a task
 * @access  Driver/Recovery
 */
driverRouter.post(
  '/tasks/:taskId/start',
  requireRole('DRIVER_RECOVERY'),
  DriverTaskController.startTask
);

/**
 * @route   POST /v1/driver/tasks/:taskId/complete
 * @desc    Complete a task with customer confirmation
 * @access  Driver/Recovery
 */
driverRouter.post(
  '/tasks/:taskId/complete',
  requireRole('DRIVER_RECOVERY'),
  DriverTaskController.completeTask
);

/**
 * @route   POST /v1/driver/tasks/:taskId/cancel
 * @desc    Cancel a task
 * @access  Driver/Recovery, Admin
 */
driverRouter.post(
  '/tasks/:taskId/cancel',
  requireRole('DRIVER_RECOVERY', 'OWNER_ADMIN'),
  DriverTaskController.cancelTask
);

/**
 * @route   POST /v1/driver/tasks/:taskId/evidence
 * @desc    Upload evidence photos for a task
 * @access  Driver/Recovery
 */
driverRouter.post(
  '/tasks/:taskId/evidence',
  requireRole('DRIVER_RECOVERY'),
  uploadRateLimiter,
  evidenceUpload,
  DriverTaskController.uploadEvidence
);

/**
 * @route   GET /v1/driver/tasks/:taskId/evidence
 * @desc    Get evidence photos for a task
 * @access  Driver/Recovery, Admin, Fleet Manager
 */
driverRouter.get(
  '/tasks/:taskId/evidence',
  requireRole('DRIVER_RECOVERY', 'OWNER_ADMIN', 'FLEET_MANAGER'),
  DriverTaskController.getEvidence
);

/**
 * @route   POST /v1/driver/tasks/:taskId/evidence/signature
 * @desc    Upload customer signature for a task
 * @access  Driver/Recovery
 */
driverRouter.post(
  '/tasks/:taskId/evidence/signature',
  requireRole('DRIVER_RECOVERY'),
  signatureUpload,
  DriverTaskController.uploadSignature
);

/**
 * @route   POST /v1/driver/tasks/:taskId/damages
 * @desc    Add damage record with photos
 * @access  Driver/Recovery
 */
driverRouter.post(
  '/tasks/:taskId/damages',
  requireRole('DRIVER_RECOVERY'),
  uploadRateLimiter,
  damageUpload,
  DriverTaskController.addDamage
);

/**
 * @route   GET /v1/driver/tasks/:taskId/damages
 * @desc    Get damage records for a task
 * @access  Driver/Recovery, Admin, Fleet Manager
 */
driverRouter.get(
  '/tasks/:taskId/damages',
  requireRole('DRIVER_RECOVERY', 'OWNER_ADMIN', 'FLEET_MANAGER'),
  DriverTaskController.getDamages
);

/**
 * @route   POST /v1/driver/tasks/:taskId/location
 * @desc    Submit location tracking updates
 * @access  Driver/Recovery
 */
driverRouter.post(
  '/tasks/:taskId/location',
  requireRole('DRIVER_RECOVERY'),
  DriverTaskController.submitLocation
);

/**
 * @route   GET /v1/driver/tasks/:taskId/location
 * @desc    Get location history for a task
 * @access  Driver/Recovery, Admin, Fleet Manager
 */
driverRouter.get(
  '/tasks/:taskId/location',
  requireRole('DRIVER_RECOVERY', 'OWNER_ADMIN', 'FLEET_MANAGER'),
  DriverTaskController.getLocationHistory
);

/**
 * @route   POST /v1/driver/tasks/:taskId/recovery-attempts
 * @desc    Log a recovery attempt
 * @access  Driver/Recovery
 */
driverRouter.post(
  '/tasks/:taskId/recovery-attempts',
  requireRole('DRIVER_RECOVERY'),
  DriverTaskController.logRecoveryAttempt
);

/**
 * @route   GET /v1/driver/tasks/:taskId/recovery-attempts
 * @desc    Get recovery attempts for a task
 * @access  Driver/Recovery, Admin, Fleet Manager
 */
driverRouter.get(
  '/tasks/:taskId/recovery-attempts',
  requireRole('DRIVER_RECOVERY', 'OWNER_ADMIN', 'FLEET_MANAGER'),
  DriverTaskController.getRecoveryAttempts
);

// Task management routes (admin/front desk)
const taskManagementRouter = express.Router();

// Apply authentication and tenant isolation to all task management routes
taskManagementRouter.use(authenticate);
taskManagementRouter.use(enforceTenantIsolation);

/**
 * @route   POST /v1/tasks
 * @desc    Create a new driver task
 * @access  Admin, Front Desk
 */
taskManagementRouter.post(
  '/',
  requireRole('OWNER_ADMIN', 'FRONT_DESK'),
  DriverTaskController.createTask
);

export { driverRouter, taskManagementRouter };
