import crypto from 'crypto';
import OtpService from '../services/otp.service.js';
import UserService from '../services/user.service.js';
import UserModel from '../models/user.model.js';
import RefreshTokenModel from '../models/refresh-token.model.js';
import { generateToken } from '../middleware/auth.middleware.js';

const REFRESH_TOKEN_EXPIRY_DAYS = parseInt(process.env.REFRESH_TOKEN_EXPIRY_DAYS || '7', 10);

class AuthController {
  /**
   * Request OTP for customer login
   * POST /auth/customer/request-otp
   */
  async requestOtp(req, res) {
    try {
      const { phone_number, tenant_id } = req.validatedBody;
      console.log('[OTP] Received phone_number:', phone_number, '| tenant_id:', tenant_id);

      // If tenant_id not provided, resolve from existing user or customer record
      let resolvedTenantId = tenant_id || null;
      if (!resolvedTenantId) {
        const user = await UserModel.findByPhoneGlobal(phone_number);
        console.log('[OTP] User lookup result:', user ? `found tenant=${user.tenant_id}` : 'not found');
        if (user) resolvedTenantId = user.tenant_id;
      }
      if (!resolvedTenantId) {
        const { default: pool } = await import('../config/database.js');
        const res2 = await pool.query(
          `SELECT tenant_id, phone_number FROM customers
           WHERE RIGHT(REGEXP_REPLACE(phone_number, '[^0-9]', '', 'g'), 9) = RIGHT(REGEXP_REPLACE($1, '[^0-9]', '', 'g'), 9)
           LIMIT 1`,
          [phone_number]
        );
        console.log('[OTP] Customer lookup result:', res2.rows[0] ? `found phone=${res2.rows[0].phone_number} tenant=${res2.rows[0].tenant_id}` : 'not found');
        if (res2.rows[0]) resolvedTenantId = res2.rows[0].tenant_id;
      }

      if (!resolvedTenantId) {
        console.log('[OTP] No tenant found for phone:', phone_number);
        return res.status(404).json({
          success: false,
          error: 'No account found for this phone number. Please contact the rental company.',
        });
      }

      // Verify customer exists and create user if needed
      await UserService.findOrCreateCustomerUser(phone_number, resolvedTenantId);

      // Generate and send OTP
      const { expiresAt } = await OtpService.generateOtp(phone_number, resolvedTenantId, 'LOGIN');

      const response = {
        success: true,
        data: {
          otp_sent: true,
          expires_in_seconds: Math.floor((new Date(expiresAt) - Date.now()) / 1000),
        },
      };

      // In dev mode: include OTP for testing
      if (process.env.NODE_ENV !== 'production') {
        const { default: OtpModel } = await import('../models/otp.model.js');
        const otp = await OtpModel.findLatestActive(phone_number, resolvedTenantId, 'LOGIN');
        if (otp) response.data.otp_code = otp.otp_code;
      }

      return res.status(200).json(response);
    } catch (error) {
      console.error('Request OTP error:', error);

      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Failed to send OTP. Please try again.',
      });
    }
  }

  /**
   * Verify OTP and return JWT tokens
   * POST /auth/customer/verify-otp
   */
  async verifyOtp(req, res) {
    try {
      const { phone_number, tenant_id, otp_code } = req.validatedBody;

      // Resolve tenant_id from user or customer record
      let resolvedTenantId = tenant_id || null;
      if (!resolvedTenantId) {
        const existingUser = await UserModel.findByPhoneGlobal(phone_number);
        if (existingUser) resolvedTenantId = existingUser.tenant_id;
      }
      if (!resolvedTenantId) {
        const { default: pool } = await import('../config/database.js');
        const res2 = await pool.query(
          `SELECT tenant_id FROM customers
           WHERE RIGHT(REGEXP_REPLACE(phone_number, '[^0-9]', '', 'g'), 9) = RIGHT(REGEXP_REPLACE($1, '[^0-9]', '', 'g'), 9)
           LIMIT 1`,
          [phone_number]
        );
        if (res2.rows[0]) resolvedTenantId = res2.rows[0].tenant_id;
      }

      if (!resolvedTenantId) {
        return res.status(404).json({
          success: false,
          error: 'No account found for this phone number.',
        });
      }

      // Verify the OTP
      const verification = await OtpService.verifyOtp(phone_number, resolvedTenantId, otp_code, 'LOGIN');

      if (!verification.valid) {
        return res.status(401).json({
          success: false,
          error: verification.error,
        });
      }

      // Get or create user
      const { user } = await UserService.findOrCreateCustomerUser(phone_number, resolvedTenantId);

      // Update last login
      await UserModel.updateLastLogin(user.id);

      // Generate access token — always issue RENTAL_CUSTOMER role in customer OTP flow
      // (staff users who share a phone with a customer get customer-scoped access)
      const accessToken = generateToken(
        user.id,
        user.tenant_id,
        user.customer_id ? 'RENTAL_CUSTOMER' : user.role,
        user.email,
        user.customer_id
      );

      // Generate refresh token
      const refreshTokenRaw = crypto.randomBytes(48).toString('hex');
      const refreshTokenHash = crypto.createHash('sha256').update(refreshTokenRaw).digest('hex');
      const refreshExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

      await RefreshTokenModel.create({
        user_id: user.id,
        token_hash: refreshTokenHash,
        device_info: req.body.device_info || null,
        expires_at: refreshExpiresAt,
      });

      return res.status(200).json({
        success: true,
        data: {
          access_token: accessToken,
          refresh_token: refreshTokenRaw,
          expires_in: parseInt(process.env.JWT_EXPIRY_SECONDS || '1800', 10),
          user: {
            id: user.id,
            tenant_id: user.tenant_id,
            role: user.role,
            customer_id: user.customer_id,
            full_name: user.full_name,
            phone_number: user.phone_number,
            email: user.email,
            profile_photo_url: user.profile_photo_url,
          },
        },
      });
    } catch (error) {
      console.error('Verify OTP error:', error);

      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Verification failed. Please try again.',
      });
    }
  }

  /**
   * Refresh access token
   * POST /auth/refresh
   */
  async refreshToken(req, res) {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        return res.status(400).json({
          success: false,
          error: 'Refresh token is required',
        });
      }

      // Hash the provided refresh token
      const tokenHash = crypto.createHash('sha256').update(refresh_token).digest('hex');

      // Find valid refresh token
      const storedToken = await RefreshTokenModel.findByTokenHash(tokenHash);

      if (!storedToken) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired refresh token',
        });
      }

      // Get user
      const user = await UserModel.findById(storedToken.user_id, null);

      if (!user || user.status !== 'ACTIVE') {
        await RefreshTokenModel.revokeByUser(storedToken.user_id);
        return res.status(401).json({
          success: false,
          error: 'User account is no longer active',
        });
      }

      // Revoke old refresh token (token rotation)
      await RefreshTokenModel.revokeByTokenHash(tokenHash);

      // Generate new access token
      const accessToken = generateToken(
        user.id,
        user.tenant_id,
        user.role,
        user.email,
        user.customer_id
      );

      // Generate new refresh token
      const newRefreshTokenRaw = crypto.randomBytes(48).toString('hex');
      const newRefreshTokenHash = crypto.createHash('sha256').update(newRefreshTokenRaw).digest('hex');
      const refreshExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

      await RefreshTokenModel.create({
        user_id: user.id,
        token_hash: newRefreshTokenHash,
        device_info: storedToken.device_info,
        expires_at: refreshExpiresAt,
      });

      return res.status(200).json({
        success: true,
        data: {
          access_token: accessToken,
          refresh_token: newRefreshTokenRaw,
          expires_in: parseInt(process.env.JWT_EXPIRY_SECONDS || '1800', 10),
        },
      });
    } catch (error) {
      console.error('Refresh token error:', error);

      return res.status(500).json({
        success: false,
        error: 'Token refresh failed',
      });
    }
  }

  /**
   * Logout - revoke all refresh tokens
   * POST /auth/logout
   */
  async logout(req, res) {
    try {
      await RefreshTokenModel.revokeByUser(req.user.id);

      return res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      console.error('Logout error:', error);

      return res.status(500).json({
        success: false,
        error: 'Logout failed',
      });
    }
  }
}

export default new AuthController();
