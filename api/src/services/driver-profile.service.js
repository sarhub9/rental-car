import driverProfileModel from '../models/driver-profile.model.js';

class DriverProfileService {
  async createDriver(tenantId, data, userId) {
    // License expiry check
    if (data.license_expiry_date && new Date(data.license_expiry_date) < new Date()) {
      throw new Error('Driving license is expired. Cannot create driver profile.');
    }

    const driver_number = await driverProfileModel.generateDriverNumber(tenantId);
    return driverProfileModel.create({ ...data, tenant_id: tenantId, driver_number, created_by_user_id: userId });
  }

  async getDriver(id, tenantId) {
    const driver = await driverProfileModel.findById(id, tenantId);
    if (!driver) throw new Error('Driver not found');
    return driver;
  }

  async listDrivers(tenantId, filters = {}) {
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const offset = (page - 1) * limit;

    const rows = await driverProfileModel.list(tenantId, { ...filters, limit, offset });
    const total = await driverProfileModel.count(tenantId);

    return { data: rows, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async updateDriver(id, tenantId, data) {
    if (data.license_expiry_date && new Date(data.license_expiry_date) < new Date()) {
      throw new Error('License expiry date cannot be in the past.');
    }
    const updated = await driverProfileModel.update(id, tenantId, data);
    if (!updated) throw new Error('Driver not found');
    return updated;
  }

  async searchDrivers(tenantId, term) {
    if (!term?.trim()) return [];
    return driverProfileModel.search(tenantId, term.trim());
  }

  async blacklistDriver(id, tenantId, reason) {
    return driverProfileModel.update(id, tenantId, { is_blacklisted: true, blacklist_reason: reason });
  }

  async unblacklistDriver(id, tenantId) {
    return driverProfileModel.update(id, tenantId, { is_blacklisted: false, blacklist_reason: null });
  }

  validateDriverDocuments(driver) {
    const issues = [];
    const today = new Date();

    if (driver.license_expiry_date && new Date(driver.license_expiry_date) < today) {
      issues.push('Driving license is expired');
    }
    if (driver.emirates_id_expiry && new Date(driver.emirates_id_expiry) < today) {
      issues.push('Emirates ID is expired');
    }
    if (driver.passport_expiry && new Date(driver.passport_expiry) < today) {
      issues.push('Passport is expired');
    }
    if (driver.visa_expiry && new Date(driver.visa_expiry) < today) {
      issues.push('Visa is expired');
    }
    if (driver.idp_required && driver.idp_expiry && new Date(driver.idp_expiry) < today) {
      issues.push('International Driving Permit is expired');
    }
    if (driver.is_blacklisted) {
      issues.push(`Driver is blacklisted: ${driver.blacklist_reason || 'No reason provided'}`);
    }

    return { valid: issues.length === 0, issues };
  }
}

export default new DriverProfileService();
