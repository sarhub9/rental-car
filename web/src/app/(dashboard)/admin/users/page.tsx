'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiOutlineUserGroup, HiOutlinePlusCircle, HiOutlineMagnifyingGlass,
  HiOutlineArrowPath, HiOutlineUser, HiXMark, HiCheck, HiChevronRight,
  HiOutlineEnvelope, HiOutlinePhone, HiOutlineBuildingOffice2,
  HiOutlineShieldCheck, HiOutlineClock, HiOutlineNoSymbol,
} from 'react-icons/hi2';
import { adminService } from '@/services/admin.service';
import { extractApiError } from '@/lib/api-error';
import type { StaffUser } from '@/types';

const ROLES: Record<string, { label: string; color: string }> = {
  OWNER_ADMIN:      { label: 'Owner Admin',      color: 'bg-red-100 text-red-700' },
  FRONT_DESK:       { label: 'Front Desk',        color: 'bg-blue-100 text-blue-700' },
  FLEET_MANAGER:    { label: 'Fleet Manager',     color: 'bg-indigo-100 text-indigo-700' },
  ACCOUNTS:         { label: 'Accounts',          color: 'bg-emerald-100 text-emerald-700' },
  DRIVER_RECOVERY:  { label: 'Driver / Recovery', color: 'bg-yellow-100 text-yellow-700' },
  SUPER_ADMIN:      { label: 'Super Admin',       color: 'bg-purple-100 text-purple-700' },
};

function roleBadge(role: string) {
  const r = ROLES[role] ?? { label: role, color: 'bg-gray-100 text-gray-600' };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${r.color}`}>{r.label}</span>;
}

function SH({ title }: { title: string }) {
  return <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 border-b border-gray-100 pb-2">{title}</p>;
}

function DRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between py-2 border-b border-gray-50 last:border-0 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-900 text-right max-w-[60%]">{value}</span>
    </div>
  );
}

function UserDrawer({ user, onClose, onRefresh }: { user: StaffUser; onClose: () => void; onRefresh: () => void }) {
  const [submitting, setSubmitting] = useState(false);

  const handleToggleStatus = async () => {
    setSubmitting(true);
    try {
      if (user.status === 'ACTIVE') {
        await adminService.deactivateUser(user.id);
        toast.success('User deactivated');
      } else {
        await adminService.activateUser(user.id);
        toast.success('User activated');
      }
      onRefresh(); onClose();
    } catch (err: any) { toast.error(extractApiError(err, 'Failed to update status')); }
    finally { setSubmitting(false); }
  };

  const handleResetPassword = async () => {
    setSubmitting(true);
    try {
      await adminService.resetUserPassword(user.id);
      toast.success('Password reset email sent');
    } catch (err: any) { toast.error(extractApiError(err, 'Failed to reset password')); }
    finally { setSubmitting(false); }
  };

  const role = ROLES[user.role] ?? { label: user.role, color: 'bg-gray-100 text-gray-600' };
  const isActive = user.status === 'ACTIVE';

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <HiOutlineUser className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">{user.full_name}</h3>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${role.color}`}>
                {role.label}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <HiXMark className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Status indicator */}
          <div className={`flex items-center gap-3 p-3 rounded-xl border-2 ${
            isActive ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <span className={`text-sm font-semibold ${isActive ? 'text-emerald-700' : 'text-red-700'}`}>
              {isActive ? 'Active Account' : 'Deactivated Account'}
            </span>
          </div>

          {/* Contact Info */}
          <div>
            <SH title="Contact Information" />
            <DRow label="Full Name"    value={user.full_name} />
            <DRow label="Email"        value={(user as any).email} />
            <DRow label="Phone"        value={(user as any).phone_number} />
          </div>

          {/* Account Info */}
          <div>
            <SH title="Account Details" />
            <DRow label="Role"         value={role.label} />
            <DRow label="Branch"       value={(user as any).branch?.name} />
            <DRow label="Last Login"   value={user.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Never'} />
            <DRow label="Created"      value={(user as any).created_at ? new Date((user as any).created_at).toLocaleDateString() : undefined} />
          </div>

          {/* Actions */}
          <div>
            <SH title="Actions" />
            <div className="space-y-3">
              <button onClick={handleResetPassword} disabled={submitting}
                className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50 text-left">
                <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                  <HiOutlineArrowPath className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Reset Password</p>
                  <p className="text-xs text-gray-400">Send a password reset email</p>
                </div>
              </button>

              <button onClick={handleToggleStatus} disabled={submitting}
                className={`w-full flex items-center gap-3 p-3 border-2 rounded-xl transition-all disabled:opacity-50 text-left ${
                  isActive
                    ? 'border-red-200 hover:bg-red-50'
                    : 'border-emerald-200 hover:bg-emerald-50'
                }`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  isActive ? 'bg-red-50' : 'bg-emerald-50'
                }`}>
                  {isActive
                    ? <HiOutlineNoSymbol className="w-4 h-4 text-red-600" />
                    : <HiCheck className="w-4 h-4 text-emerald-600" />}
                </div>
                <div>
                  <p className={`text-sm font-semibold ${isActive ? 'text-red-700' : 'text-emerald-700'}`}>
                    {isActive ? 'Deactivate User' : 'Activate User'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {isActive ? 'Prevent this user from logging in' : 'Restore login access'}
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/60">
          <button onClick={onClose}
            className="w-full px-5 py-2.5 border border-gray-300 bg-white rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all">
            Close
          </button>
        </div>
      </div>
    </>
  );
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers]               = useState<StaffUser[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [roleFilter, setRoleFilter]     = useState('ALL');
  const [selectedUser, setSelectedUser] = useState<StaffUser | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { limit: 100 };
      if (search.trim()) params.search = search.trim();
      const res = await adminService.getUsers(params);
      let items: StaffUser[] = [];
      if (Array.isArray(res)) items = res;
      else if (res && Array.isArray(res.data)) items = res.data;
      else if (res && Array.isArray(res.results)) items = res.results;
      setUsers(items);
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to load users'));
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = users.filter(u => roleFilter === 'ALL' || u.role === roleFilter);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <HiOutlineUserGroup className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Users</h1>
            <p className="text-sm text-gray-500">{users.length} user{users.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button onClick={() => router.push('/admin/users/create')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 shadow-sm transition-all">
          <HiOutlinePlusCircle className="w-5 h-5" />
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all" />
        </div>

        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          <button onClick={() => setRoleFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              roleFilter === 'ALL' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}>All</button>
          {Object.entries(ROLES).map(([val, r]) => (
            <button key={val} onClick={() => setRoleFilter(val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                roleFilter === val ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}>{r.label}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
              <HiOutlineUserGroup className="w-7 h-7 text-blue-400" />
            </div>
            <p className="text-gray-500 font-medium">No users found</p>
            <p className="text-gray-400 text-sm mt-1">
              {search || roleFilter !== 'ALL' ? 'Try adjusting your filters' : 'Add the first user to get started'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/60 border-b border-gray-100">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Branch</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Login</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-3 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((u, idx) => {
                const isActive = u.status === 'ACTIVE';
                return (
                  <tr key={u.id}
                    onClick={() => setSelectedUser(u)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors group">
                    <td className="px-5 py-4 text-gray-400 text-xs">{idx + 1}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                          <span className="text-white text-xs font-bold">
                            {u.full_name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{u.full_name}</p>
                          <p className="text-xs text-gray-400">{(u as any).email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">{roleBadge(u.role)}</td>
                    <td className="px-5 py-4 text-gray-500 text-sm">{(u as any).branch?.name ?? '—'}</td>
                    <td className="px-5 py-4 text-gray-500 text-xs">
                      {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      <HiChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Drawer */}
      {selectedUser && (
        <UserDrawer
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onRefresh={fetchUsers}
        />
      )}
    </div>
  );
}
