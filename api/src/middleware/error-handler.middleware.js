import { v4 as uuidv4 } from 'uuid';

/**
 * Application Error class with status code support
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
  }
}

/**
 * Map database/system errors to user-friendly messages
 */
const getUserFriendlyMessage = (error) => {
  if (error.code === '23505') return 'A record with this information already exists';
  if (error.code === '23503') return 'Referenced record does not exist';
  if (error.code === '23502') return 'Required field is missing';
  if (error.code === '23514') return 'Value violates a data constraint';
  if (error.code === 'ECONNREFUSED') return 'Service temporarily unavailable';
  if (error.type === 'entity.too.large') return 'Request body is too large';
  if (error.message?.includes('Multer')) return 'File upload error: ' + error.message;
  return null;
};

/**
 * Centralized error handler middleware (4-arg signature required by Express)
 */
export const errorHandler = (err, req, res, _next) => {
  const correlationId = req.correlationId || uuidv4();

  let statusCode = err.statusCode || err.status || 500;
  let message = err.message;

  // Map known DB/system error types to friendly messages
  const friendlyMessage = getUserFriendlyMessage(err);
  if (friendlyMessage && statusCode === 500) {
    statusCode = 400;
    message = friendlyMessage;
  }

  // Log server errors with stack trace
  if (statusCode >= 500) {
    console.error(`[${correlationId}] ERROR ${req.method} ${req.path}:`, {
      message: err.message,
      stack: err.stack,
    });
  }

  // Hide internal details in production
  if (statusCode >= 500 && process.env.NODE_ENV === 'production') {
    message = 'An unexpected error occurred. Please try again later.';
  }

  const response = {
    success: false,
    error: message,
    correlationId,
  };

  if (err.details) response.details = err.details;
  if (err.conflicts) response.conflicts = err.conflicts;

  res.status(statusCode).json(response);
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
    correlationId: req.correlationId || uuidv4(),
  });
};
