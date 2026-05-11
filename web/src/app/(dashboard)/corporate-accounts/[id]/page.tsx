'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowLeft,
  HiOutlineBuildingOffice2,
  HiOutlinePencilSquare,
  HiOutlineChartBar,
} from 'react-icons/hi2';
import { corporateAccountService } from '@/services/corporate-account.service';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { Modal } from '@/components/Modal';
import { Spinner } from '@/components/Spinner';
import { cleanPayload } from '@/lib/clean-payload';
import { extractApiError } from '@/lib/api-error';

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <div className="text-sm font-medium text-gray-900 mt-0.5">{value ?? '—'}</div>
    </div>
  );
}

export default function CorporateAccountDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [account, setAccount] = useState<any>(null);
  const [aging, setAging] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [form, setForm] = useState({
    company_name: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    credit_limit: '',
    credit_days: '',
    notes: '',
  });

  const fetchAccount = useCallback(async () => {
    try {
      setLoading(true);
      const res = await corporateAccountService.getCorporateAccountById(id as string);
      const data = res?.data ?? res;
      setAccount(data);
      setForm({
        company_name: data.company_name ?? '',
        contact_email: data.contact_email ?? '',
        contact_phone: data.contact_phone ?? '',
        address: data.address ?? '',
        credit_limit: data.credit_limit != null ? String(data.credit_limit) : '',
        credit_days: data.credit_days != null ? String(data.credit_days) : '',
        notes: data.notes ?? '',
      });
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to load account'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchAging = useCallback(async () => {
    try {
      const res = await corporateAccountService.getARAgingReport();
      const items = Array.isArray(res) ? res : (res?.data || []);
      const acct = items.find((a: any) => a.id === id || a.corporate_account_id === id);
      if (acct) setAging(acct);
    } catch {
      // Aging report is optional
    }
  }, [id]);

  useEffect(() => {
    fetchAccount();
    fetchAging();
  }, [fetchAccount, fetchAging]);

  const handleEdit = async () => {
    if (!form.company_name.trim()) { toast.error('Company name is required'); return; }
    try {
      setSubmitting(true);
      const payload: Record<string, any> = { ...form };
      if (payload.credit_limit) payload.credit_limit = Number(payload.credit_limit);
      else delete payload.credit_limit;
      if (payload.credit_days) payload.credit_days = Number(payload.credit_days);
      else delete payload.credit_days;
      await corporateAccountService.updateCorporateAccount(id as string, cleanPayload(payload));
      toast.success('Account updated');
      setShowEditModal(false);
      fetchAccount();
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to update account'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner /></div>;
  }

  if (!account) {
    return <div className="text-center py-20 text-gray-500">Account not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/corporate-accounts')} className="text-gray-500 hover:text-gray-700">
            <HiOutlineArrowLeft className="h-5 w-5" />
          </button>
          <PageHeader title={account.company_name} />
        </div>
        <button
          onClick={() => setShowEditModal(true)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
        >
          <HiOutlinePencilSquare className="h-4 w-4" />
          Edit
        </button>
      </div>

      {/* Account Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <HiOutlineBuildingOffice2 className="h-5 w-5 text-indigo-500" />
          Account Details
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          <InfoRow label="Company Name" value={account.company_name} />
          <InfoRow label="Status" value={<StatusBadge status={account.status ?? 'ACTIVE'} />} />
          <InfoRow label="Contact Email" value={account.contact_email} />
          <InfoRow label="Contact Phone" value={account.contact_phone} />
          <InfoRow label="Address" value={account.address} />
          <InfoRow
            label="Credit Limit"
            value={account.credit_limit != null ? `AED ${Number(account.credit_limit).toLocaleString()}` : '—'}
          />
          <InfoRow
            label="Outstanding Balance"
            value={
              account.outstanding_balance != null
                ? <span className={Number(account.outstanding_balance) > 0 ? 'text-red-600' : undefined}>
                    AED {Number(account.outstanding_balance).toLocaleString()}
                  </span>
                : '—'
            }
          />
          <InfoRow label="Credit Days" value={account.credit_days != null ? `${account.credit_days} days` : '—'} />
          <InfoRow label="Created" value={account.created_at ? new Date(account.created_at).toLocaleDateString() : '—'} />
        </div>
        {account.notes && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Notes</p>
            <p className="text-sm text-gray-700">{account.notes}</p>
          </div>
        )}
      </div>

      {/* AR Aging */}
      {aging && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <HiOutlineChartBar className="h-5 w-5 text-amber-500" />
            AR Aging
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Current (0-30d)', key: 'current' },
              { label: '31-60 days', key: 'days_31_60' },
              { label: '61-90 days', key: 'days_61_90' },
              { label: '90+ days', key: 'days_over_90' },
            ].map(({ label, key }) => (
              <div key={key} className="border border-gray-200 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  AED {Number(aging[key] ?? 0).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agreements */}
      {Array.isArray(account.agreements) && account.agreements.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Linked Agreements</h2>
          <div className="space-y-2">
            {account.agreements.map((ag: any) => (
              <div key={ag.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-700 font-mono">{ag.agreement_number ?? ag.id?.slice(0, 8)}</span>
                <StatusBadge status={ag.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Corporate Account">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Company Name <span className="text-red-500">*</span></label>
            <input type="text" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Contact Email</label>
              <input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Contact Phone</label>
              <input type="text" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Address</label>
            <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Credit Limit (AED)</label>
              <input type="number" value={form.credit_limit} onChange={(e) => setForm({ ...form, credit_limit: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Credit Days</label>
              <input type="number" value={form.credit_days} onChange={(e) => setForm({ ...form, credit_days: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowEditModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={handleEdit} disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
              {submitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
