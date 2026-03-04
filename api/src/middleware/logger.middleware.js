import { v4 as uuidv4 } from 'uuid';

/**
 * Request Logger Middleware
 * Generates correlation IDs and logs requests/responses with timing
 */
export const requestLogger = (req, res, next) => {
  const correlationId = req.headers['x-correlation-id'] || uuidv4();
  req.correlationId = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);

  const startTime = Date.now();

  console.log(`[${correlationId}] --> ${req.method} ${req.path}`);

  const originalEnd = res.end;
  res.end = function (...args) {
    const duration = Date.now() - startTime;
    const status = res.statusCode;
    const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';

    const logLine = `[${correlationId}] <-- ${status} ${req.method} ${req.path} (${duration}ms)`;
    if (level === 'error') console.error(logLine);
    else if (level === 'warn') console.warn(logLine);
    else console.log(logLine);

    originalEnd.apply(res, args);
  };

  next();
};
