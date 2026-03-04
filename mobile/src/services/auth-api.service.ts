import axios from 'axios';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.18.15:3000/v1';

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: {
    id: string;
    tenant_id: string;
    role: string;
    customer_id?: string;
    full_name: string;
    phone_number: string;
    email?: string;
    profile_photo_url?: string;
  };
}

export interface OtpRequestResponse {
  otp_sent: boolean;
  expires_in_seconds: number;
  otp_code?: string; // Only in dev mode
}

/**
 * Auth API Service
 * Handles authentication API calls (no auth interceptor - public endpoints)
 */
class AuthApiService {
  private client;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Request OTP for customer login
   */
  async requestOtp(phoneNumber: string, tenantId: string): Promise<OtpRequestResponse> {
    const response = await this.client.post('/auth/customer/request-otp', {
      phone_number: phoneNumber,
      tenant_id: tenantId,
    });
    return response.data.data;
  }

  /**
   * Verify OTP and get JWT tokens
   */
  async verifyOtp(
    phoneNumber: string,
    tenantId: string,
    otpCode: string,
    deviceInfo?: Record<string, unknown>
  ): Promise<AuthResponse> {
    const response = await this.client.post('/auth/customer/verify-otp', {
      phone_number: phoneNumber,
      tenant_id: tenantId,
      otp_code: otpCode,
      device_info: deviceInfo,
    });
    return response.data.data;
  }

  /**
   * Staff login with email and password
   */
  async staffLogin(email: string, password: string, tenantId: string): Promise<AuthResponse> {
    const response = await this.client.post('/auth/staff/login', {
      email,
      password,
      tenant_id: tenantId,
    });
    return response.data.data;
  }

  /**
   * Request password reset for staff
   */
  async forgotPassword(email: string, tenantId: string): Promise<{ message: string; reset_token?: string }> {
    const response = await this.client.post('/auth/staff/forgot-password', {
      email,
      tenant_id: tenantId,
    });
    return response.data.data;
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const response = await this.client.post('/auth/staff/reset-password', {
      token,
      new_password: newPassword,
    });
    return response.data.data;
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
    const response = await this.client.post('/auth/refresh', {
      refresh_token: refreshToken,
    });
    return response.data.data;
  }

  /**
   * Logout - revoke refresh tokens
   */
  async logout(accessToken: string): Promise<void> {
    await this.client.post('/auth/logout', null, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }
}

export default new AuthApiService();
