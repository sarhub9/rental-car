'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiArrowLeft,
  HiPencilSquare,
  HiArrowPath,
  HiCheck,
  HiXMark,
} from 'react-icons/hi2';
import { adminService } from '@/services/admin.service';
import { extractApiError } from '@/lib/api-error';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/Button';
import type { StaffUser } from '@/types';

const ROLES = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'SUPERVISOR', label: 'Supervisor' },
  { value: 'ACCOUNTANT', label: 'Accountant' },
  { value: 'SALES_AGENT', label: 'Sales Agent' },
  { value: 'FLEET_COORDINATOR', label: 'Fleet Coordinator' },
  { value: 'VIEWER', label: 'Viewer' },
];

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    role: '',
  });

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminService.getUserById(userId);
      setUser(data);
      setForm({
        full_name: data.full_name || '',
        email: data.email || '',
        phone_number: data.phone_number || '',
        role: data.role || 'VIEWER',
      });
    } catch (error: any) {
      toast.error(extractApiError(error, 'Failed to load user'));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleSave = async () => {
    if (!form.full_name || !form.email || !form.phone_number) {
      toast.error('Please fill in all required fields');
      return;
    }
    try {
      setSubmitting(true);
      await adminService.updateUser(userId, form);
      toast.success('User updated successfully');
      setEditing(false);
      fetchUser();
    } catch (error: any) {
      toast.error(extractApiError(error, 'Failed to update user'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!user) return;
    try {
      setSubmitting(true);
      if (user.status === 'ACTIVE') {
        await adminService.deactivateUser(userId);
        toast.success('User deactivated');
      } else {
        await adminService.activateUser(userId);
        toast.success('User activated');
      }
      fetchUser();
    } catch (error: any) {
      toast.error(extractApiError(error, 'Failed to update user status'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      setSubmitting(true);
      await adminService.resetUserPassword(userId);
      toast.success('Password reset email sent');
    } catch (error: any) {
      toast.error(extractApiError(error, 'Failed to reset password'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">User not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/admin/users')}>
          Back to Users
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/admin/users')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <HiArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">User Details</h1>
        </div>
        <StatusBadge status={user.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE'} />
      </div>

      {/* User Info Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">User Information</h2>
          {!editing && (
            <Button variant="outline" onClick={() => setEditing(true)}>
              <HiPencilSquare className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>

        {editing ? (
          <div className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
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
            <div className="flex gap-3 pt-4">
              <Button onClick={handleSave} disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditing(false);
                  setForm({
                    full_name: user.full_name || '',
                    email: user.email || '',
                    phone_number: user.phone_number || '',
                    role: user.role || 'VIEWER',
                  });
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500">Full Name</p>
              <p className="font-medium">
                {user.full_name || '' || '—'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{user.email || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone Number</p>
              <p className="font-medium">{user.phone_number || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Role</p>
              <p className="font-medium">
                {ROLES.find((r) => r.value === user.role)?.label || user.role || '—'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Last Login</p>
              <p className="font-medium">
                {user.last_login_at
                  ? new Date(user.last_login_at).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Never'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Created</p>
              <p className="font-medium">
                {user.created_at
                  ? new Date(user.created_at).toLocaleDateString('en-GB')
                  : '—'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Actions Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Button
            variant={user.status === 'ACTIVE' ? 'danger' : 'primary'}
            onClick={handleToggleStatus}
            disabled={submitting}
          >
            {user.status === 'ACTIVE' ? (
              <>
                <HiXMark className="h-4 w-4 mr-2" />
                Deactivate User
              </>
            ) : (
              <>
                <HiCheck className="h-4 w-4 mr-2" />
                Activate User
              </>
            )}
          </Button>
          <Button variant="outline" onClick={handleResetPassword} disabled={submitting}>
            <HiArrowPath className="h-4 w-4 mr-2" />
            Reset Password
          </Button>
        </div>
      </div>
    </div>
  );
}
