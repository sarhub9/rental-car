'use client';

import { useState, useEffect, useCallback } from 'react';
import { customerService } from '@/services/customer.service';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { Modal } from '@/components/Modal';
import { Customer } from '@/types';
import toast from 'react-hot-toast';
import { HiPlus, HiMagnifyingGlass, HiPencilSquare, HiXMark } from 'react-icons/hi2';
import { cleanPayload, sanitizeUuidFields } from '@/lib/clean-payload';

const EMIRATES = [
  'Abu Dhabi',
  'Dubai',
  'Sharjah',
  'Ajman',
  'Umm Al Quwain',
  'Ras Al Khaimah',
  'Fujairah',
];

const initialFormState = {
  full_name_en: '',
  full_name_ar: '',
  phone_number: '',
  email: '',
  emirates_id: '',
  driving_license_number: '',
  license_expiry_date: '',
  customer_type: 'INDIVIDUAL' as 'INDIVIDUAL' | 'CORPORATE',
  address_line_1: '',
  address_line_2: '',
  city: '',
  emirate: '',
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (debouncedSearch.trim()) {
        res = await customerService.searchCustomers(debouncedSearch);
      } else {
        res = await customerService.getCustomers({ page, limit: 10 });
      }

      // Handle response - API returns array directly after our service fix
      if (Array.isArray(res)) {
        setCustomers(res);
        setTotalCount(res.length);
        setTotalPages(1);
      } else if (res.data) {
        // Fallback for paginated response
        setCustomers(res.data);
        setTotalPages(res.totalPages || 1);
        setTotalCount(res.total || res.data.length);
      } else {
        // Direct data
        setCustomers(res);
        setTotalCount(res.length || 0);
        setTotalPages(1);
      }
    } catch {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name_en || !formData.phone_number || !formData.driving_license_number || !formData.license_expiry_date) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const payload = cleanPayload(formData) as Record<string, unknown>;
      await customerService.createCustomer(payload as any);
      toast.success('Customer created successfully');
      setShowAddModal(false);
      setFormData(initialFormState);
      fetchCustomers();
    } catch {
      toast.error('Failed to create customer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    setSubmitting(true);
    try {
      const payload = cleanPayload(formData) as Record<string, unknown>;
      await customerService.updateCustomer(selectedCustomer.id, payload as any);
      toast.success('Customer updated successfully');
      setIsEditing(false);
      setShowDetailModal(false);
      fetchCustomers();
    } catch {
      toast.error('Failed to update customer');
    } finally {
      setSubmitting(false);
    }
  };

  const openDetailModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      full_name_en: customer.full_name_en || '',
      full_name_ar: customer.full_name_ar || '',
      phone_number: customer.phone_number || '',
      email: customer.email || '',
      emirates_id: customer.emirates_id || '',
      driving_license_number: customer.driving_license_number || '',
      license_expiry_date: customer.license_expiry_date ? customer.license_expiry_date.substring(0, 10) : '',
      customer_type: customer.customer_type || 'INDIVIDUAL',
      address_line_1: customer.address_line_1 || '',
      address_line_2: customer.address_line_2 || '',
      city: customer.city || '',
      emirate: customer.emirate || '',
    });
    setIsEditing(false);
    setShowDetailModal(true);
  };

  const columns = [
    { label: 'Customer #', render: (_: Customer, i: number) => (page - 1) * 10 + i + 1 },
    { label: 'Name (EN)', render: (c: Customer) => c.full_name_en },
    { label: 'Phone', render: (c: Customer) => c.phone_number },
    { label: 'License', render: (c: Customer) => c.driving_license_number },
    {
      label: 'Type',
      render: (c: Customer) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.customer_type === 'CORPORATE' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
          {c.customer_type}
        </span>
      ),
    },
    {
      label: 'Status',
      render: (c: Customer) => <StatusBadge status={c.is_active ? 'ACTIVE' : 'INACTIVE'} />,
    },
    {
      label: 'Actions',
      render: (c: Customer) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            openDetailModal(c);
          }}
          className="text-blue-600 hover:text-blue-800"
        >
          <HiPencilSquare className="w-5 h-5" />
        </button>
      ),
    },
  ];

  const renderFormFields = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name (EN) *</label>
        <input
          type="text"
          name="full_name_en"
          value={formData.full_name_en}
          onChange={handleInputChange}
          required
          disabled={showDetailModal && !isEditing}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name (AR)</label>
        <input
          type="text"
          name="full_name_ar"
          value={formData.full_name_ar}
          onChange={handleInputChange}
          disabled={showDetailModal && !isEditing}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          dir="rtl"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
        <input
          type="text"
          name="phone_number"
          value={formData.phone_number}
          onChange={handleInputChange}
          required
          disabled={showDetailModal && !isEditing}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          disabled={showDetailModal && !isEditing}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Emirates ID</label>
        <input
          type="text"
          name="emirates_id"
          value={formData.emirates_id}
          onChange={handleInputChange}
          disabled={showDetailModal && !isEditing}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Driving License # *</label>
        <input
          type="text"
          name="driving_license_number"
          value={formData.driving_license_number}
          onChange={handleInputChange}
          required
          disabled={showDetailModal && !isEditing}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">License Expiry Date *</label>
        <input
          type="date"
          name="license_expiry_date"
          value={formData.license_expiry_date}
          onChange={handleInputChange}
          required
          disabled={showDetailModal && !isEditing}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Customer Type</label>
        <select
          name="customer_type"
          value={formData.customer_type}
          onChange={handleInputChange}
          disabled={showDetailModal && !isEditing}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        >
          <option value="INDIVIDUAL">Individual</option>
          <option value="CORPORATE">Corporate</option>
        </select>
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
        <input
          type="text"
          name="address_line_1"
          value={formData.address_line_1}
          onChange={handleInputChange}
          disabled={showDetailModal && !isEditing}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        />
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
        <input
          type="text"
          name="address_line_2"
          value={formData.address_line_2}
          onChange={handleInputChange}
          disabled={showDetailModal && !isEditing}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
        <input
          type="text"
          name="city"
          value={formData.city}
          onChange={handleInputChange}
          disabled={showDetailModal && !isEditing}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Emirate</label>
        <select
          name="emirate"
          value={formData.emirate}
          onChange={handleInputChange}
          disabled={showDetailModal && !isEditing}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        >
          <option value="">Select Emirate</option>
          {EMIRATES.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <button
          onClick={() => {
            setFormData(initialFormState);
            setShowAddModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <HiPlus className="w-5 h-5" />
          Add Customer
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search customers by name, phone, or license..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns as any}
        data={customers}
        loading={loading}
        onRowClick={(customer: Customer) => openDetailModal(customer)}
        emptyMessage="No customers found"
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-600">
            Showing page {page} of {totalPages} ({totalCount} total)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Customer"
      >
        <form onSubmit={handleAddCustomer}>
          {renderFormFields()}
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Customer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Customer Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setIsEditing(false);
        }}
        title={isEditing ? 'Edit Customer' : 'Customer Details'}
      >
        {selectedCustomer && (
          <form onSubmit={handleUpdateCustomer}>
            {renderFormFields()}
            <div className="flex justify-end gap-3 mt-6">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="inline-flex items-center gap-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <HiXMark className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setShowDetailModal(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <HiPencilSquare className="w-4 h-4" />
                    Edit
                  </button>
                </>
              )}
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
