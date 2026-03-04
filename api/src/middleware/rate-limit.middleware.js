import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter - 100 requests/minute per tenant
 */
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_PER_MINUTE || '100', 10),
  keyGenerator: (req) => req.tenantId || req.user?.tenantId || req.ip,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many requests. Please try again later.',
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Photo upload rate limiter - 20 uploads/minute per tenant
 */
/**
 * OTP rate limiter - 5 requests/15 minutes per phone number
 */
export const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.OTP_RATE_LIMIT || '5', 10),
  keyGenerator: (req) => `otp:${req.body?.phone_number || req.ip}`,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many OTP requests. Please try again later.',
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Photo upload rate limiter - 20 uploads/minute per tenant
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.UPLOAD_RATE_LIMIT_PER_MINUTE || '20', 10),
  keyGenerator: (req) => `upload:${req.tenantId || req.ip}`,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many upload requests. Please slow down.',
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});
