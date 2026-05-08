'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiUserGroup,
  HiPlus,
  HiMagnifyingGlass,
  HiArrowPath,
  HiCheck,
  HiXMark,
} from 'react-icons/hi2';
import { adminService } from '@/services/admin.service';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { Pagination } from '@/components/Pagination';
import { PageHeader } from '@/components/PageHeader';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import type { StaffUser, PaginatedResponse } from '@/types';

const ROLES = [
  { value: 'OWNER_ADMIN', label: 'Owner Admin', color: 'bg-red-100 text-red-800' },
  { value: 'FRONT_DESK', label: 'Front Desk', color: 'bg-blue-100 text-blue-800' },
  { value: 'FLEET_MANAGER', label: 'Fleet Manager', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'ACCOUNTS', label: 'Accounts', color: 'bg-green-100 text-green-800' },
  { value: 'DRIVER_RECOVERY', label: 'Driver / Recovery', color: 'bg-yellow-100 text-yellow-800' },
];

function getRoleBadge(role: string) {
  const found = ROLES.find((r) => r.value === role);
  const colorClass = found?.color || 'bg-gray-100 text-gray-800';
  const label = found?.label || role;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  );
}

const INITIAL_FORM = {
  full_name: '',
  email: '',
  phone_number: '',
  role: 'FRONT_DESK',
  password: '',
};

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = { limit: 20, offset: (page - 1) * 20 };
      if (searchQuery) params.search = searchQuery;

      const res = await adminService.getUsers(params);

      // Normalize response to array
      let items: StaffUser[] = [];
      if (Array.isArray(res)) {
        items = res;
      } else if (res && Array.isArray(res.data)) {
        items = res.data;
      } else if (res && Array.isArray(res.results)) {
        items = res.results;
      }
      setUsers(items);
      setTotalCount(items.length);
      setTotalPages(1);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  const handleAddUser = async () => {
    if (!form.full_name || !form.email || !form.phone_number) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (!form.password) {
      toast.error('Password is required for new users');
      return;
    }
    try {
      setSubmitting(true);
      await adminService.createUser(form);
      toast.success('User created successfully');
      setShowAddModal(false);
      setForm(INITIAL_FORM);
      fetchUsers();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || error?.response?.data?.error || 'Failed to create user'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (e: React.MouseEvent, user: StaffUser) => {
    e.stopPropagation();
    try {
      if (user.status === 'ACTIVE') {
        await adminService.deactivateUser(user.id);
        toast.success('User deactivated');
      } else {
        await adminService.activateUser(user.id);
        toast.success('User activated');
      }
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const handleResetPassword = async (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    try {
      await adminService.resetUserPassword(userId);
      toast.success('Password reset email sent');
    } catch (error) {
      toast.error('Failed to reset password');
    }
  };

  const columns = [
    {
      key: 'full_name',
      label: 'Name',
    },
    {
      key: 'email',
      label: 'Email',
    },
    {
      key: 'phone_number',
      label: 'Phone',
    },
    {
      key: 'role',
      label: 'Role',
      render: (_: any, row: StaffUser) => getRoleBadge(row.role),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_: any, row: StaffUser) => <StatusBadge status={row.status} />,
    },
    {
      key: 'last_login_at',
      label: 'Last Login',
      render: (_: any, row: StaffUser) =>
        row.last_login_at
          ? new Date(row.last_login_at).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : 'Never',
    },
    {
      key: 'id',
      label: 'Actions',
      render: (_: any, row: StaffUser) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => handleToggleStatus(e, row)}
            className={`p-1.5 rounded-lg transition-colors ${
              row.status === 'ACTIVE'
                ? 'text-red-600 hover:bg-red-50'
                : 'text-green-600 hover:bg-green-50'
            }`}
            title={row.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          >
            {row.status === 'ACTIVE' ? <HiXMark className="h-4 w-4" /> : <HiCheck className="h-4 w-4" />}
          </button>
          <button
            onClick={(e) => handleResetPassword(e, row.id)}
            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
            title="Reset Password"
          >
            <HiArrowPath className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        actions={
          <Button onClick={() => setShowAddModal(true)}>
            <HiPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        }
      />

      <div className="relative">
        <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search users by name, email, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        onRowClick={(row: StaffUser) => router.push(`/admin/users/${row.id}`)}
        emptyMessage="No users found"
      />

      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalCount={totalCount}
          onPageChange={setPage}
        />
      )}

      {/* Add User Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setForm(INITIAL_FORM);
        }}
        title="Add New User"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="Enter full name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Enter email address"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              value={form.phone_number}
              onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
              placeholder="Enter phone number"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role *
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password *
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Enter password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddModal(false);
                setForm(INITIAL_FORM);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddUser} disabled={submitting}>
              {submitting ? 'Creating...' : 'Create User'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
