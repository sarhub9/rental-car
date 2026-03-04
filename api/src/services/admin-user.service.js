import UserModel from '../models/user.model.js';
import StaffAuthService from './staff-auth.service.js';
import pool from '../config/database.js';
import crypto from 'crypto';

class AdminUserService {
  /**
   * List users with filters and pagination
   */
  async listUsers(tenantId, filters = {}) {
    return UserModel.list(tenantId, filters);
  }

  /**
   * Create a new staff user
   */
  async createUser(tenantId, data) {
    // Check for duplicate email
    const existing = await UserModel.findByEmail(data.email, tenantId);
    if (existing) {
      const error = new Error('A user with this email already exists');
      error.statusCode = 409;
      throw error;
    }

    // Check for duplicate phone
    const existingPhone = await UserModel.findByPhone(data.phone_number, tenantId);
    if (existingPhone) {
      const error = new Error('A user with this phone number already exists');
      error.statusCode = 409;
      throw error;
    }

    // Hash password
    const passwordHash = await StaffAuthService.hashPassword(data.password);

    const user = await UserModel.create({
      tenant_id: tenantId,
      full_name: data.full_name,
      email: data.email,
      phone_number: data.phone_number,
      role: data.role,
      password_hash: passwordHash,
      status: 'ACTIVE',
    });

    // Remove password_hash from response
    const { password_hash, ...safeUser } = user;
    return safeUser;
  }

  /**
   * Update an existing staff user
   */
  async updateUser(userId, tenantId, data) {
    const user = await UserModel.findById(userId, tenantId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    if (user.role === 'RENTAL_CUSTOMER') {
      const error = new Error('Cannot modify customer users through admin API');
      error.statusCode = 400;
      throw error;
    }

    // If changing email, check uniqueness
    if (data.email && data.email !== user.email) {
      const existing = await UserModel.findByEmail(data.email, tenantId);
      if (existing) {
        const error = new Error('A user with this email already exists');
        error.statusCode = 409;
        throw error;
      }
    }

    // If changing role, handle with updateRole
    if (data.role && data.role !== user.role) {
      // If changing away from OWNER_ADMIN, check last-admin constraint
      if (user.role === 'OWNER_ADMIN') {
        await this._checkLastAdmin(tenantId);
      }
      await UserModel.updateRole(userId, tenantId, data.role);
    }

    // Update profile fields
    const profileFields = {};
    if (data.full_name) profileFields.full_name = data.full_name;
    if (data.email) profileFields.email = data.email;
    if (data.phone_number) {
      // Update phone via direct query since updateProfile doesn't handle it
      await pool.query(
        'UPDATE users SET phone_number = $1 WHERE id = $2 AND tenant_id = $3',
        [data.phone_number, userId, tenantId]
      );
    }

    if (Object.keys(profileFields).length > 0) {
      await UserModel.updateProfile(userId, tenantId, profileFields);
    }

    const updated = await UserModel.findById(userId, tenantId);
    const { password_hash, ...safeUser } = updated;
    return safeUser;
  }

  /**
   * Deactivate a user
   */
  async deactivateUser(userId, tenantId) {
    const user = await UserModel.findById(userId, tenantId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // Cannot deactivate the last OWNER_ADMIN
    if (user.role === 'OWNER_ADMIN') {
      await this._checkLastAdmin(tenantId);
    }

    await UserModel.updateStatus(userId, tenantId, 'INACTIVE');
    return { message: 'User deactivated successfully' };
  }

  /**
   * Activate a user
   */
  async activateUser(userId, tenantId) {
    const user = await UserModel.findById(userId, tenantId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    await pool.query(
      `UPDATE users SET status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL WHERE id = $1 AND tenant_id = $2`,
      [userId, tenantId]
    );

    return { message: 'User activated successfully' };
  }

  /**
   * Trigger password reset for a user
   */
  async triggerPasswordReset(userId, tenantId) {
    const user = await UserModel.findById(userId, tenantId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    if (!user.email) {
      const error = new Error('User has no email address');
      error.statusCode = 400;
      throw error;
    }

    return StaffAuthService.generateResetToken(user.email, tenantId);
  }

  /**
   * Check that there is more than one active OWNER_ADMIN
   */
  async _checkLastAdmin(tenantId) {
    const count = await UserModel.countByRoleAndStatus(tenantId, 'OWNER_ADMIN', 'ACTIVE');
    if (count <= 1) {
      const error = new Error('Cannot modify or deactivate the last Owner/Admin user');
      error.statusCode = 409;
      throw error;
    }
  }
}

export default new AdminUserService();
