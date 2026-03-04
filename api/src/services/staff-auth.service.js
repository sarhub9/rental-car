import bcrypt from 'bcrypt';
import crypto from 'crypto';
import pool from '../config/database.js';
import UserModel from '../models/user.model.js';
import { generateToken } from '../middleware/auth.middleware.js';

const SALT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 30;
const RESET_TOKEN_EXPIRY_HOURS = 1;

class StaffAuthService {
  /**
   * Staff login with email and password
   */
  async login(email, password, tenantId) {
    const user = await UserModel.findByEmail(email, tenantId);

    if (!user) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    // Check if user is a staff member (not a customer)
    if (user.role === 'RENTAL_CUSTOMER') {
      const error = new Error('Staff login not available for customer accounts');
      error.statusCode = 403;
      throw error;
    }

    // Check if account is locked
    if (user.status === 'LOCKED') {
      if (user.locked_until && new Date(user.locked_until) > new Date()) {
        const error = new Error('Account is temporarily locked. Please try again later.');
        error.statusCode = 423;
        throw error;
      }
      // Lock expired — unlock the account
      await pool.query(
        `UPDATE users SET status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL WHERE id = $1`,
        [user.id]
      );
    }

    if (user.status === 'INACTIVE') {
      const error = new Error('Account is deactivated. Contact your administrator.');
      error.statusCode = 403;
      throw error;
    }

    // Verify password
    if (!user.password_hash) {
      const error = new Error('Password not set. Use forgot password to set one.');
      error.statusCode = 401;
      throw error;
    }

    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      const attempts = await UserModel.incrementFailedAttempts(user.id);

      if (attempts >= MAX_FAILED_ATTEMPTS) {
        const lockUntil = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000);
        await UserModel.lockUser(user.id, lockUntil);
        const error = new Error(`Account locked due to too many failed attempts. Try again after ${LOCK_DURATION_MINUTES} minutes.`);
        error.statusCode = 423;
        throw error;
      }

      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    // Successful login — reset failed attempts and update last login
    await UserModel.updateLastLogin(user.id);

    // Generate tokens
    const accessToken = generateToken(user.id, user.tenant_id, user.role, user.email);

    // Generate refresh token
    const refreshTokenRaw = crypto.randomBytes(40).toString('hex');
    const refreshTokenHash = crypto.createHash('sha256').update(refreshTokenRaw).digest('hex');
    const refreshExpiresAt = new Date(Date.now() + (parseInt(process.env.REFRESH_TOKEN_EXPIRY_DAYS || '7', 10)) * 24 * 60 * 60 * 1000);

    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
      [user.id, refreshTokenHash, refreshExpiresAt]
    );

    return {
      access_token: accessToken,
      refresh_token: refreshTokenRaw,
      expires_in: 1800, // 30 minutes
      user: {
        id: user.id,
        tenant_id: user.tenant_id,
        role: user.role,
        full_name: user.full_name,
        phone_number: user.phone_number,
        email: user.email,
        profile_photo_url: user.profile_photo_url,
      },
    };
  }

  /**
   * Generate a password reset token
   */
  async generateResetToken(email, tenantId) {
    const user = await UserModel.findByEmail(email, tenantId);

    if (!user || user.role === 'RENTAL_CUSTOMER') {
      // Don't reveal whether user exists
      return { message: 'If the email exists, a reset link has been sent.' };
    }

    // Invalidate any existing tokens
    await pool.query(
      `UPDATE password_reset_tokens SET is_used = TRUE WHERE user_id = $1 AND is_used = FALSE`,
      [user.id]
    );

    // Generate token
    const tokenRaw = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(tokenRaw).digest('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
      [user.id, tokenHash, expiresAt]
    );

    // In production, send email here. For dev, return the token.
    const result = { message: 'If the email exists, a reset link has been sent.' };
    if (process.env.NODE_ENV === 'development') {
      result.reset_token = tokenRaw;
    }

    return result;
  }

  /**
   * Reset password using token
   */
  async resetPassword(token, newPassword) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const result = await pool.query(
      `SELECT * FROM password_reset_tokens WHERE token_hash = $1 AND is_used = FALSE AND expires_at > NOW()`,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      const error = new Error('Invalid or expired reset token');
      error.statusCode = 400;
      throw error;
    }

    const resetRecord = result.rows[0];

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password
    await pool.query(
      `UPDATE users SET password_hash = $1, failed_login_attempts = 0, status = 'ACTIVE', locked_until = NULL WHERE id = $2`,
      [passwordHash, resetRecord.user_id]
    );

    // Mark token as used
    await pool.query(
      `UPDATE password_reset_tokens SET is_used = TRUE, used_at = NOW() WHERE id = $1`,
      [resetRecord.id]
    );

    return { message: 'Password has been reset successfully' };
  }

  /**
   * Hash a password (for creating staff users)
   */
  async hashPassword(password) {
    return bcrypt.hash(password, SALT_ROUNDS);
  }
}

export default new StaffAuthService();
