'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiOutlineBuildingOffice2,
  HiOutlinePlusCircle,
  HiOutlineFunnel,
} from 'react-icons/hi2';
import { corporateAccountService } from '@/services/corporate-account.service';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { Modal } from '@/components/Modal';
import { Spinner } from '@/components/Spinner';
import { cleanPayload } from '@/lib/clean-payload';
import { extractApiError } from '@/lib/api-error';

const emptyForm = {
  company_name: '',
  contact_person: '',
  email: '',
  phone: '',
  billing_address: '',
  credit_limit: '',
  payment_terms_days: '',
};

export default function CorporateAccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { router.prefetch('/corporate-accounts'); }, [router]);

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await corporateAccountService.listCorporateAccounts();
      setAccounts(Array.isArray(res) ? res : (res?.data || []));
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to load corporate accounts'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const handleCreate = async () => {
    if (!form.company_name.trim()) { toast.error('Company name is required'); return; }
    try {
      setSubmitting(true);
      const payload: Record<string, any> = { ...form };
      if (payload.credit_limit) payload.credit_limit = Number(payload.credit_limit);
      if (payload.payment_terms_days) payload.payment_terms_days = Number(payload.payment_terms_days);
      await corporateAccountService.createCorporateAccount(cleanPayload(payload));
      toast.success('Corporate account created');
      setShowCreateModal(false);
      setForm({ ...emptyForm });
      fetchAccounts();
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to create corporate account'));
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Company',
      render: (row: any) => (
        <span className="font-medium text-gray-900">{row.company_name}</span>
      ),
    },
    {
      header: 'Contact',
      render: (row: any) => row.contact_person ?? row.email ?? '—',
    },
    {
      header: 'Phone',
      render: (row: any) => row.phone ?? '—',
    },
    {
      header: 'Credit Limit',
      render: (row: any) =>
        row.credit_limit != null ? `AED ${Number(row.credit_limit).toLocaleString()}` : '—',
    },
    {
      header: 'Outstanding',
      render: (row: any) =>
        row.outstanding_balance != null
          ? <span className={Number(row.outstanding_balance) > 0 ? 'text-red-600 font-medium' : 'text-gray-700'}>
              AED {Number(row.outstanding_balance).toLocaleString()}
            </span>
          : '—',
    },
    {
      header: 'Status',
      render: (row: any) => <StatusBadge status={row.status ?? 'ACTIVE'} />,
    },
    {
      header: '',
      render: (row: any) => (
        <button
          onClick={(e) => { e.stopPropagation(); router.push(`/corporate-accounts/${row.id}`); }}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          View
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
            <HiOutlineBuildingOffice2 className="h-5 w-5 text-indigo-600" />
          </div>
          <PageHeader title="Corporate Accounts" />
        </div>
        <button
          onClick={() => { setForm({ ...emptyForm }); setShowCreateModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <HiOutlinePlusCircle className="h-5 w-5" />
          New Account
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <DataTable
          columns={columns}
          data={accounts}
          onRowClick={(row: any) => router.push(`/corporate-accounts/${row.id}`)}
          emptyMessage="No corporate accounts found."
        />
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="New Corporate Account">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.company_name}
              onChange={(e) => setForm({ ...form, company_name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. Acme Corp LLC"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Contact Person</label>
              <input
                type="text"
                value={form.contact_person}
                onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. John Smith"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Phone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="+971 4 xxx xxxx"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="billing@company.com"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Billing Address</label>
            <input
              type="text"
              value={form.billing_address}
              onChange={(e) => setForm({ ...form, billing_address: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Company billing address"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Credit Limit (AED)</label>
              <input
                type="number"
                value={form.credit_limit}
                onChange={(e) => setForm({ ...form, credit_limit: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Payment Terms (days)</label>
              <input
                type="number"
                value={form.payment_terms_days}
                onChange={(e) => setForm({ ...form, payment_terms_days: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="30"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {submitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {submitting ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
