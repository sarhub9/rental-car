'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  HiChevronRight, HiXMark, HiMagnifyingGlass,
  HiOutlineShieldCheck, HiOutlineBanknotes, HiOutlineNoSymbol, HiOutlineArrowUturnLeft,
} from 'react-icons/hi2';
import { accountsService } from '@/services/accounts.service';
import { extractApiError } from '@/lib/api-error';
import { cleanPayload } from '@/lib/clean-payload';

type DepositStatus = 'ALL' | 'HELD' | 'USED' | 'RELEASED' | 'FORFEITED' | 'REFUNDED';

const STATUS_BADGE: Record<string, string> = {
  HELD:      'bg-blue-100 text-blue-700',
  USED:      'bg-amber-100 text-amber-700',
  RELEASED:  'bg-emerald-100 text-emerald-700',
  FORFEITED: 'bg-red-100 text-red-700',
  REFUNDED:  'bg-purple-100 text-purple-700',
};

// ── Action Drawer ─────────────────────────────────────────────────────────────
function DepositDrawer({ open, onClose, deposit, onSaved }: {
  open: boolean; onClose: () => void; deposit: any | null; onSaved: () => void;
}) {
  const [useAmount, setUseAmount]           = useState('');
  const [forfeitReason, setForfeitReason]   = useState('');
  const [action, setAction]                 = useState<'view' | 'use' | 'forfeit'>('view');
  const [submitting, setSubmitting]         = useState(false);

  useEffect(() => {
    if (open) { setAction('view'); setUseAmount(''); setForfeitReason(''); }
  }, [open, deposit]);

  if (!deposit) return null;

  const badgeClass = STATUS_BADGE[deposit.status] || 'bg-gray-100 text-gray-500';

  const handleUse = async () => {
    if (!useAmount) return;
    setSubmitting(true);
    try {
      await accountsService.useDeposit(deposit.id, Number(useAmount));
      toast.success('Deposit used successfully');
      onSaved(); onClose();
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to use deposit'));
    } finally { setSubmitting(false); }
  };

  const handleRelease = async () => {
    setSubmitting(true);
    try {
      await accountsService.releaseDeposit(deposit.id);
      toast.success('Deposit released');
      onSaved(); onClose();
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to release deposit'));
    } finally { setSubmitting(false); }
  };

  const handleForfeit = async () => {
    if (!forfeitReason.trim()) { toast.error('Justification is required'); return; }
    setSubmitting(true);
    try {
      const payload = cleanPayload({ justification: forfeitReason });
      await accountsService.forfeitDeposit(deposit.id, payload.justification as string);
      toast.success('Deposit forfeited');
      onSaved(); onClose();
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to forfeit deposit'));
    } finally { setSubmitting(false); }
  };

  const handleRefund = async () => {
    setSubmitting(true);
    try {
      await accountsService.refundDeposit(deposit.id);
      toast.success('Deposit refunded');
      onSaved(); onClose();
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to refund deposit'));
    } finally { setSubmitting(false); }
  };

  return (
    <>
      <div onClick={onClose}
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <HiOutlineShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Deposit Details</h2>
              <p className="text-xs text-gray-500">{deposit.agreement_number ?? deposit.agreement_id ?? '—'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-200 transition-colors">
            <HiXMark className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">Deposit Info</p>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Amount</span>
                <span className="text-sm font-bold text-gray-900">AED {Number(deposit.amount ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badgeClass}`}>{deposit.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Customer</span>
                <span className="text-sm font-semibold text-gray-900">{deposit.customer?.name ?? deposit.customer_name ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Collected At</span>
                <span className="text-sm text-gray-700">{deposit.collected_at ? new Date(deposit.collected_at).toLocaleDateString() : '—'}</span>
              </div>
            </div>
          </div>

          {/* Actions for HELD */}
          {deposit.status === 'HELD' && action === 'view' && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">Actions</p>
              <div className="space-y-2">
                <button onClick={() => setAction('use')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-blue-200 bg-blue-50 text-blue-700 text-sm font-semibold hover:bg-blue-100 transition-colors">
                  <HiOutlineBanknotes className="w-5 h-5" /> Use Deposit
                </button>
                <button onClick={handleRelease} disabled={submitting}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-semibold hover:bg-emerald-100 transition-colors disabled:opacity-50">
                  <HiOutlineShieldCheck className="w-5 h-5" /> Release Deposit
                </button>
                <button onClick={() => setAction('forfeit')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-red-200 bg-red-50 text-red-700 text-sm font-semibold hover:bg-red-100 transition-colors">
                  <HiOutlineNoSymbol className="w-5 h-5" /> Forfeit Deposit
                </button>
              </div>
            </div>
          )}

          {/* Use form */}
          {action === 'use' && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">Use Deposit</p>
              <p className="text-sm text-gray-500 mb-3">Available: <span className="font-bold text-gray-900">AED {Number(deposit.amount ?? 0).toLocaleString()}</span></p>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Amount to Use (AED)</label>
              <input type="number" value={useAmount} onChange={e => setUseAmount(e.target.value)}
                max={deposit.amount} placeholder="Enter amount"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white" />
            </div>
          )}

          {/* Forfeit form */}
          {action === 'forfeit' && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">Forfeit Deposit</p>
              <p className="text-sm text-gray-500 mb-3">Forfeiting <span className="font-bold text-gray-900">AED {Number(deposit.amount ?? 0).toLocaleString()}</span></p>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Justification</label>
              <textarea value={forfeitReason} onChange={e => setForfeitReason(e.target.value)} rows={4}
                placeholder="Provide justification..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 bg-white resize-none" />
            </div>
          )}

          {/* Actions for RELEASED */}
          {deposit.status === 'RELEASED' && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">Actions</p>
              <button onClick={handleRefund} disabled={submitting}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-purple-200 bg-purple-50 text-purple-700 text-sm font-semibold hover:bg-purple-100 transition-colors disabled:opacity-50">
                <HiOutlineArrowUturnLeft className="w-5 h-5" /> Refund Deposit
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          {action === 'use' ? (
            <div className="flex gap-3">
              <button onClick={() => setAction('view')}
                className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleUse} disabled={submitting || !useAmount}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50">
                {submitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {submitting ? 'Processing...' : 'Confirm Use'}
              </button>
            </div>
          ) : action === 'forfeit' ? (
            <div className="flex gap-3">
              <button onClick={() => setAction('view')}
                className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleForfeit} disabled={submitting || !forfeitReason.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50">
                {submitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {submitting ? 'Processing...' : 'Confirm Forfeit'}
              </button>
            </div>
          ) : (
            <button onClick={onClose}
              className="w-full py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">
              Close
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DepositsPage() {
  const [deposits, setDeposits]         = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [statusFilter, setStatusFilter] = useState<DepositStatus>('ALL');
  const [activeTab, setActiveTab]       = useState<'all' | 'eligible'>('all');
  const [search, setSearch]             = useState('');
  const [drawerOpen, setDrawerOpen]     = useState(false);
  const [selected, setSelected]         = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (activeTab === 'eligible') params.eligible_for_release = 'true';
      const res = await accountsService.getDeposits(params);
      setDeposits(Array.isArray(res) ? res : (res?.data ?? []));
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to load deposits'));
    } finally { setLoading(false); }
  }, [statusFilter, activeTab]);

  useEffect(() => { load(); }, [load]);

  const filtered = deposits.filter(d =>
    !search ||
    (d.agreement_number ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (d.customer_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (d.customer?.name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deposits</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {deposits.length > 0 ? `${deposits.length} deposit${deposits.length !== 1 ? 's' : ''}` : 'Security deposit management'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {[
          { key: 'all', label: 'All Deposits' },
          { key: 'eligible', label: 'Eligible for Release' },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setActiveTab(key as any)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search by agreement or customer..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 bg-white" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as DepositStatus)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 min-w-[150px]">
          <option value="ALL">All Statuses</option>
          <option value="HELD">Held</option>
          <option value="USED">Used</option>
          <option value="RELEASED">Released</option>
          <option value="FORFEITED">Forfeited</option>
          <option value="REFUNDED">Refunded</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <HiOutlineShieldCheck className="w-7 h-7 text-gray-400" />
            </div>
            <p className="font-semibold text-gray-700">No deposits found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Agreement</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Collected</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(d => {
                const badgeClass = STATUS_BADGE[d.status] || 'bg-gray-100 text-gray-500';
                return (
                  <tr key={d.id} onClick={() => { setSelected(d); setDrawerOpen(true); }}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors group">
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs text-gray-700">{d.agreement_number ?? d.agreement_id ?? '—'}</span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700">{d.customer?.name ?? d.customer_name ?? '—'}</td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-bold text-gray-900">AED {Number(d.amount ?? 0).toLocaleString()}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badgeClass}`}>{d.status}</span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {d.collected_at ? new Date(d.collected_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <HiChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <DepositDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        deposit={selected}
        onSaved={load}
      />
    </div>
  );
}
