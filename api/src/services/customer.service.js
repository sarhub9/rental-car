import CustomerModel from '../models/customer.model.js';

class CustomerService {
  async create(data) {
    // Only validate license expiry if provided
    if (data.license_expiry_date) {
      this.validateLicenseExpiry(data.license_expiry_date);
    }

    const customerNumber = await CustomerModel.generateCustomerNumber(data.tenant_id);
    data.customer_number = customerNumber;

    return CustomerModel.create(data);
  }

  async getById(id, tenantId) {
    const customer = await CustomerModel.findById(id, tenantId);
    if (!customer) throw new Error('Customer not found');
    return customer;
  }

  async list(tenantId, filters) {
    return CustomerModel.list(tenantId, filters);
  }

  async update(id, tenantId, data) {
    if (data.license_expiry_date) {
      this.validateLicenseExpiry(data.license_expiry_date);
    }

    const customer = await CustomerModel.update(id, tenantId, data);
    if (!customer) throw new Error('Customer not found');
    return customer;
  }

  async search(tenantId, searchTerm) {
    if (!searchTerm || searchTerm.length < 2) {
      throw new Error('Search term must be at least 2 characters');
    }
    return CustomerModel.search(tenantId, searchTerm);
  }

  validateLicenseExpiry(expiryDate) {
    const expiry = new Date(expiryDate);
    if (expiry < new Date()) {
      throw new Error('Driving license has expired');
    }
  }
}

export default new CustomerService();
