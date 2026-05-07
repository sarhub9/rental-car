import express from 'express';
import StaffAuthController from '../controllers/staff-auth.controller.js';
import { validate, staffLoginSchema, forgotPasswordSchema, resetPasswordSchema } from '../utils/validation.util.js';

const router = express.Router();

/**
 * @route   POST /v1/auth/staff/login
 * @desc    Staff email/password login (tenant_id optional)
 * @access  Public
 */
router.post('/login', validate(staffLoginSchema), StaffAuthController.login);

/**
 * @route   POST /v1/auth/staff/forgot-password
 * @desc    Request password reset token
 * @access  Public
 */
router.post('/forgot-password', validate(forgotPasswordSchema), StaffAuthController.forgotPassword);

/**
 * @route   POST /v1/auth/staff/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', validate(resetPasswordSchema), StaffAuthController.resetPassword);

export default router;
