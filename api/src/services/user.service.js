import UserModel from '../models/user.model.js';
import CustomerModel from '../models/customer.model.js';
import pool from '../config/database.js';

class UserService {
  /**
   * Find or create a user linked to a customer record.
   * Customer must already exist (registered by front desk).
   * @returns {{ user: object, isNewUser: boolean }}
   */
  async findOrCreateCustomerUser(phoneNumber, tenantId) {
    // 1. Check if a user already exists for this phone in this tenant
    let user = await UserModel.findByPhone(phoneNumber, tenantId);
    console.log('[UserService] findByPhone result:', user ? `found id=${user.id} role=${user.role} status=${user.status}` : 'not found');

    if (user) {
      if (user.status === 'LOCKED') {
        if (user.locked_until && new Date(user.locked_until) > new Date()) {
          const error = new Error('Account is temporarily locked. Please try again later.');
          error.statusCode = 403;
          throw error;
        }
        user = await UserModel.updateLastLogin(user.id);
      }
      if (user.status === 'INACTIVE') {
        const error = new Error('Account is inactive. Please contact the rental company.');
        error.statusCode = 403;
        throw error;
      }
      return { user, isNewUser: false };
    }

    // 2. No user yet — look up customer record by phone to create one
    const customer = await this._findCustomerByPhone(phoneNumber, tenantId);
    console.log('[UserService] findCustomerByPhone result:', customer ? `found id=${customer.id}` : 'not found');

    if (!customer) {
      const error = new Error(`No customer account found for phone number '${phoneNumber}' in tenant '${tenantId}'. Please contact the rental company.`);
      error.statusCode = 404;
      throw error;
    }

    if (!customer.is_active) {
      const error = new Error(`Customer account is inactive for phone number '${phoneNumber}'. Please contact the rental company.`);
      error.statusCode = 403;
      throw error;
    }

    if (customer.is_blacklisted) {
      const error = new Error(`Account has been suspended for phone number '${phoneNumber}'. Please contact the rental company.`);
      error.statusCode = 403;
      throw error;
    }

    // 3. Check if a user already exists linked to this customer
    user = await UserModel.findByCustomerId(customer.id);

    if (user) {
      if (user.status === 'LOCKED') {
        if (user.locked_until && new Date(user.locked_until) > new Date()) {
          const error = new Error('Account is temporarily locked. Please try again later.');
          error.statusCode = 403;
          throw error;
        }
        user = await UserModel.updateLastLogin(user.id);
      }
      if (user.status === 'INACTIVE') {
        const error = new Error('Account is inactive. Please contact the rental company.');
        error.statusCode = 403;
        throw error;
      }
      return { user, isNewUser: false };
    }

    // 4. Create new user linked to customer
    user = await UserModel.create({
      tenant_id: tenantId,
      phone_number: customer.phone_number,
      email: customer.email,
      role: 'RENTAL_CUSTOMER',
      customer_id: customer.id,
      full_name: customer.full_name_en,
    });

    return { user, isNewUser: true };
  }

  /**
   * Get user profile with customer details
   */
  async getProfile(userId, tenantId) {
    const user = await UserModel.findById(userId, tenantId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    let customer = null;
    if (user.customer_id) {
      customer = await CustomerModel.findById(user.customer_id, tenantId);
    }

    return {
      id: user.id,
      tenant_id: user.tenant_id,
      role: user.role,
      phone_number: user.phone_number,
      email: user.email,
      full_name: user.full_name,
      profile_photo_url: user.profile_photo_url,
      last_login_at: user.last_login_at,
      customer: customer ? {
        id: customer.id,
        customer_number: customer.customer_number,
        full_name_en: customer.full_name_en,
        full_name_ar: customer.full_name_ar,
        phone_number: customer.phone_number,
        email: customer.email,
        emirates_id: customer.emirates_id,
        driving_license_number: customer.driving_license_number,
        license_expiry_date: customer.license_expiry_date,
        customer_type: customer.customer_type,
        address_line_1: customer.address_line_1,
        address_line_2: customer.address_line_2,
        city: customer.city,
        emirate: customer.emirate,
      } : null,
    };
  }

  /**
   * Update customer-editable profile fields
   */
  async updateProfile(userId, tenantId, data) {
    const user = await UserModel.findById(userId, tenantId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // Update user fields
    const userUpdates = {};
    if (data.full_name) userUpdates.full_name = data.full_name;
    if (data.email) userUpdates.email = data.email;
    if (data.profile_photo_url) userUpdates.profile_photo_url = data.profile_photo_url;

    if (Object.keys(userUpdates).length > 0) {
      await UserModel.updateProfile(userId, tenantId, userUpdates);
    }

    // Update customer fields (if linked)
    if (user.customer_id) {
      const customerUpdates = {};
      if (data.full_name_en) customerUpdates.full_name_en = data.full_name_en;
      if (data.full_name_ar) customerUpdates.full_name_ar = data.full_name_ar;
      if (data.email) customerUpdates.email = data.email;
      if (data.address_line_1 !== undefined) customerUpdates.address_line_1 = data.address_line_1;
      if (data.address_line_2 !== undefined) customerUpdates.address_line_2 = data.address_line_2;
      if (data.city !== undefined) customerUpdates.city = data.city;
      if (data.emirate !== undefined) customerUpdates.emirate = data.emirate;

      if (Object.keys(customerUpdates).length > 0) {
        await CustomerModel.update(user.customer_id, tenantId, customerUpdates);
      }
    }

    return this.getProfile(userId, tenantId);
  }

  /**
   * Find customer by phone number (direct query)
   */
  async _findCustomerByPhone(phoneNumber, tenantId) {
    let query, values;
    if (tenantId) {
      query = `SELECT * FROM customers
               WHERE RIGHT(REGEXP_REPLACE(phone_number, '[^0-9]', '', 'g'), 9) = RIGHT(REGEXP_REPLACE($1, '[^0-9]', '', 'g'), 9)
               AND tenant_id = $2 LIMIT 1`;
      values = [phoneNumber, tenantId];
    } else {
      query = `SELECT * FROM customers
               WHERE RIGHT(REGEXP_REPLACE(phone_number, '[^0-9]', '', 'g'), 9) = RIGHT(REGEXP_REPLACE($1, '[^0-9]', '', 'g'), 9)
               LIMIT 1`;
      values = [phoneNumber];
    }
    const result = await pool.query(query, values);
    return result.rows[0];
  }
}

export default new UserService();
