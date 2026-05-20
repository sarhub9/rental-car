import crypto from 'crypto';
import OtpModel from '../models/otp.model.js';

const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10);
const OTP_MAX_REQUESTS = parseInt(process.env.OTP_MAX_REQUESTS || (process.env.NODE_ENV === 'development' ? '20' : '5'), 10);
const OTP_RATE_WINDOW_MINUTES = parseInt(process.env.OTP_RATE_WINDOW_MINUTES || '15', 10);

class OtpService {
  /**
   * Generate and store a 6-digit OTP
   * @returns {{ otpId: string, expiresAt: Date }}
   */
  async generateOtp(phoneNumber, tenantId, purpose = 'LOGIN') {
    // Rate limiting: check recent OTP requests
    const recentCount = await OtpModel.countRecentRequests(
      phoneNumber, tenantId, OTP_RATE_WINDOW_MINUTES
    );

    if (recentCount >= OTP_MAX_REQUESTS) {
      const error = new Error('Too many OTP requests. Please try again later.');
      error.statusCode = 429;
      throw error;
    }

    // Invalidate any existing unexpired OTPs for this phone+tenant+purpose
    await OtpModel.invalidateAll(phoneNumber, tenantId, purpose);

    // Generate 6-digit OTP (fixed in dev for testing)
    const otpCode = process.env.NODE_ENV !== 'production'
      ? (process.env.DEV_OTP || '123456')
      : crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    const otp = await OtpModel.create({
      phone_number: phoneNumber,
      tenant_id: tenantId,
      otp_code: otpCode,
      purpose,
      expires_at: expiresAt,
    });

    // In development: log OTP to console
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV] OTP for ${phoneNumber}: ${otpCode}`);
    } else {
      // In production: send via SMS gateway
      await this._sendSms(phoneNumber, otpCode);
    }

    return {
      otpId: otp.id,
      expiresAt: otp.expires_at,
    };
  }

  /**
   * Verify an OTP code
   * @returns {{ valid: boolean, error?: string }}
   */
  async verifyOtp(phoneNumber, tenantId, otpCode, purpose = 'LOGIN') {
    const otp = await OtpModel.findLatestActive(phoneNumber, tenantId, purpose);

    if (!otp) {
      return { valid: false, error: 'OTP expired or not found. Please request a new one.' };
    }

    if (otp.attempts >= otp.max_attempts) {
      return { valid: false, error: 'Too many failed attempts. Please request a new OTP.' };
    }

    // Increment attempts before checking code
    await OtpModel.incrementAttempts(otp.id);

    if (otp.otp_code !== otpCode) {
      const remaining = otp.max_attempts - otp.attempts - 1;
      return {
        valid: false,
        error: remaining > 0
          ? `Invalid OTP. ${remaining} attempt(s) remaining.`
          : 'Too many failed attempts. Please request a new OTP.',
      };
    }

    // Mark as verified
    await OtpModel.markVerified(otp.id);

    return { valid: true };
  }

  /**
   * Clean up expired OTP records (call periodically)
   */
  async cleanupExpired() {
    const count = await OtpModel.deleteExpired();
    if (count > 0) {
      console.log(`Cleaned up ${count} expired OTP records`);
    }
    return count;
  }

  /**
   * Send OTP via SMS (production only)
   * Abstracted for easy gateway swap (Twilio, MessageBird, etc.)
   */
  async _sendSms(phoneNumber, otpCode) {
    // TODO: Integrate with UAE SMS gateway (Twilio, MessageBird, etc.)
    // For now, log a warning
    console.warn(`[SMS] Would send OTP ${otpCode} to ${phoneNumber} — SMS gateway not configured`);
  }
}

export default new OtpService();
