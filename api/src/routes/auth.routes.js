import express from 'express';
import AuthController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../utils/validation.util.js';
import { otpRateLimiter } from '../middleware/rate-limit.middleware.js';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const requestOtpSchema = Joi.object({
  phone_number: Joi.string().pattern(/^\+?[0-9]{7,15}$/).required()
    .messages({ 'string.pattern.base': 'Phone number must be 7-15 digits, optionally starting with +' }),
  tenant_id: Joi.string().uuid().required(),
});

const verifyOtpSchema = Joi.object({
  phone_number: Joi.string().pattern(/^\+?[0-9]{7,15}$/).required(),
  tenant_id: Joi.string().uuid().required(),
  otp_code: Joi.string().length(6).pattern(/^[0-9]+$/).required()
    .messages({ 'string.pattern.base': 'OTP must be exactly 6 digits' }),
  device_info: Joi.object().optional(),
});

/**
 * @route   POST /v1/auth/customer/request-otp
 * @desc    Send OTP to customer phone number
 * @access  Public
 */
router.post(
  '/customer/request-otp',
  otpRateLimiter,
  validate(requestOtpSchema),
  AuthController.requestOtp
);

/**
 * @route   POST /v1/auth/customer/verify-otp
 * @desc    Verify OTP and return JWT tokens
 * @access  Public
 */
router.post(
  '/customer/verify-otp',
  validate(verifyOtpSchema),
  AuthController.verifyOtp
);

/**
 * @route   POST /v1/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post('/refresh', AuthController.refreshToken);

/**
 * @route   POST /v1/auth/logout
 * @desc    Revoke all refresh tokens for user
 * @access  Authenticated
 */
router.post('/logout', authenticate, AuthController.logout);

export default router;
