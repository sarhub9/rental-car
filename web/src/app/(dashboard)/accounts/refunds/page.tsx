'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowUturnLeft, HiOutlinePlusCircle, HiOutlineMagnifyingGlass,
  HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineBanknotes, HiChevronRight,
  HiOutlineUser, HiXMark, HiOutlineClock, HiCheck,
} from 'react-icons/hi2';
import { refundService } from '@/services/refund.service';
import { cleanPayload } from '@/lib/clean-payload';
import { extractApiError } from '@/lib/api-error';

const STATUS_OPTIONS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'PROCESSED'];

const STATUS_BADGE: Record<string, string> = {
  PENDING:   'bg-yellow-100 text-yellow-700',
  APPROVED:  'bg-blue-100 text-blue-700',
  REJECTED:  'bg-red-100 text-red-700',
  PROCESSED: 'bg-emerald-100 text-emerald-700',
};

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

type DrawerState = 'view' | 'reject' | 'process';

function RefundDrawer({ refund, onClose, onRefresh }: { refund: any; onClose: () => void; onRefresh: () => void }) {
  const [state, setState]       = useState<DrawerState>('view');
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting]     = useState(false);

  useEffect(() => { setState('view'); setRejectReason(''); }, [refund?.id]);

  const handleApprove = async () => {
    setSubmitting(true);
    try {
      await refundService.approveRefund(refund.id);
      toast.success('Refund approved');
      onRefresh(); onClose();
    } catch (err: any) { toast.error(extractApiError(err, 'Failed to approve')); }
    finally { setSubmitting(false); }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { toast.error('Rejection reason is required'); return; }
    setSubmitting(true);
    try {
      await refundService.rejectRefund(refund.id, rejectReason);
      toast.success('Refund rejected');
      onRefresh(); onClose();
    } catch (err: any) { toast.error(extractApiError(err, 'Failed to reject')); }
    finally { setSubmitting(false); }
  };

  const handleProcess = async () => {
    setSubmitting(true);
    try {
      await refundService.processRefund(refund.id);
      toast.success('Refund processed');
      onRefresh(); onClose();
    } catch (err: any) { toast.error(extractApiError(err, 'Failed to process')); }
    finally { setSubmitting(false); }
  };

  const statusCls = STATUS_BADGE[refund?.status] ?? 'bg-gray-100 text-gray-600';

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/40 z-40 transition-opacity" onClick={onClose} />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
              <HiOutlineArrowUturnLeft className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">{refund?.refund_number ?? 'Refund Request'}</h3>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${statusCls}`}>
                {refund?.status}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <HiXMark className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {state === 'view' && (
            <>
              {/* Amount highlight */}
              <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-purple-200 bg-purple-50">
                <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center">
                  <HiOutlineBanknotes className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-purple-600 font-medium">Refund Amount</p>
                  <p className="text-xl font-bold text-gray-900">AED {Number(refund?.amount ?? 0).toLocaleString()}</p>
                </div>
              </div>

              {/* Customer */}
              <div>
                <SH title="Customer" />
                {refund?.customer ? (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
                      <HiOutlineUser className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{refund.customer.full_name_en}</p>
                      <p className="text-xs text-gray-500">{refund.customer.phone_number}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No customer info</p>
                )}
              </div>

              {/* Refund Details */}
              <div>
                <SH title="Refund Details" />
                <DRow label="Refund #"       value={refund?.refund_number} />
                <DRow label="Payment #"      value={refund?.payment?.payment_number ?? refund?.payment_id?.slice(0, 8)} />
                <DRow label="Method"         value={(refund?.method ?? '').replace(/_/g, ' ') || undefined} />
                <DRow label="Requested"      value={refund?.created_at ? new Date(refund.created_at).toLocaleDateString() : undefined} />
                <DRow label="Processed At"   value={refund?.processed_at ? new Date(refund.processed_at).toLocaleDateString() : undefined} />
              </div>

              {/* Reason */}
              {refund?.reason && (
                <div>
                  <SH title="Reason" />
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3">{refund.reason}</p>
                </div>
              )}

              {/* Rejection note */}
              {refund?.rejection_reason && (
                <div>
                  <SH title="Rejection Reason" />
                  <p className="text-sm text-red-700 bg-red-50 rounded-xl p-3">{refund.rejection_reason}</p>
                </div>
              )}

              {/* Action Buttons */}
              {refund?.status === 'PENDING' && (
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={handleApprove} disabled={submitting}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-all">
                    <HiCheck className="w-4 h-4" /> Approve
                  </button>
                  <button onClick={() => setState('reject')}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-red-200 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-50 transition-all">
                    <HiOutlineXCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              )}

              {refund?.status === 'APPROVED' && (
                <button onClick={() => setState('process')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all">
                  <HiOutlineBanknotes className="w-4 h-4" /> Mark as Processed
                </button>
              )}
            </>
          )}

          {state === 'reject' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                <HiOutlineXCircle className="w-5 h-5 text-red-600 shrink-0" />
                <p className="text-sm text-red-700 font-medium">
                  Rejecting refund of <strong>AED {Number(refund?.amount ?? 0).toLocaleString()}</strong>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={4}
                  placeholder="Explain why this refund is being rejected..."
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500/10 focus:border-red-500 focus:outline-none resize-none transition-all" />
              </div>
            </div>
          )}

          {state === 'process' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <HiOutlineBanknotes className="w-5 h-5 text-blue-600 shrink-0" />
                <p className="text-sm text-blue-700 font-medium">
                  Confirm payment of <strong>AED {Number(refund?.amount ?? 0).toLocaleString()}</strong> has been processed?
                </p>
              </div>
              <p className="text-sm text-gray-500">
                This will mark the refund as <span className="font-semibold text-emerald-600">PROCESSED</span>. This action cannot be undone.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/60 flex items-center gap-3">
          {state === 'view' ? (
            <button onClick={onClose}
              className="ml-auto px-5 py-2.5 border border-gray-300 bg-white rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all">
              Close
            </button>
          ) : state === 'reject' ? (
            <>
              <button onClick={() => setState('view')}
                className="px-4 py-2.5 border border-gray-300 bg-white rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all">
                Cancel
              </button>
              <button onClick={handleReject} disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all">
                {submitting
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Rejecting...</>
                  : <><HiOutlineXCircle className="w-4 h-4" />Confirm Reject</>}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setState('view')}
                className="px-4 py-2.5 border border-gray-300 bg-white rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all">
                Cancel
              </button>
              <button onClick={handleProcess} disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all">
                {submitting
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing...</>
                  : <><HiCheck className="w-4 h-4" />Confirm Processed</>}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default function RefundsPage() {
  const router = useRouter();
  const [refunds, setRefunds]         = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch]           = useState('');
  const [selectedRefund, setSelectedRefund] = useState<any>(null);

  const fetchRefunds = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const res = await refundService.listRefunds(params);
      setRefunds(Array.isArray(res) ? res : (res?.data ?? []));
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to load refunds'));
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchRefunds(); }, [fetchRefunds]);

  const filtered = refunds.filter(r => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (r.refund_number ?? '').toLowerCase().includes(q) ||
      (r.customer?.full_name_en ?? '').toLowerCase().includes(q) ||
      (r.customer?.phone_number ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
            <HiOutlineArrowUturnLeft className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Refunds</h1>
            <p className="text-sm text-gray-500">{refunds.length} refund request{refunds.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button onClick={() => router.push('/accounts/refunds/create')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 shadow-sm transition-all">
          <HiOutlinePlusCircle className="w-5 h-5" />
          Request Refund
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, phone, refund #..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all" />
        </div>

        {/* Status tabs */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {STATUS_OPTIONS.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === s ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {s === 'ALL' ? 'All' : s[0] + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-4">
              <HiOutlineArrowUturnLeft className="w-7 h-7 text-purple-400" />
            </div>
            <p className="text-gray-500 font-medium">No refunds found</p>
            <p className="text-gray-400 text-sm mt-1">
              {search || statusFilter !== 'ALL' ? 'Try adjusting your filters' : 'No refund requests yet'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/60 border-b border-gray-100">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Refund</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Requested</th>
                <th className="px-3 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((r, idx) => {
                const badge = STATUS_BADGE[r.status] ?? 'bg-gray-100 text-gray-600';
                return (
                  <tr key={r.id}
                    onClick={() => setSelectedRefund(r)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors group">
                    <td className="px-5 py-4 text-gray-400 text-xs">{idx + 1}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                          <HiOutlineArrowUturnLeft className="w-4 h-4 text-purple-500" />
                        </div>
                        <div>
                          <p className="font-mono text-xs font-semibold text-gray-900">
                            {r.refund_number ?? r.id?.slice(0, 8)}
                          </p>
                          {r.payment?.payment_number && (
                            <p className="text-xs text-gray-400 font-mono">{r.payment.payment_number}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {r.customer ? (
                        <div>
                          <p className="font-medium text-gray-900">{r.customer.full_name_en}</p>
                          <p className="text-xs text-gray-400">{r.customer.phone_number}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-semibold text-gray-900">AED {Number(r.amount ?? 0).toLocaleString()}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-3 py-4">
                      <HiChevronRight className="w-4 h-4 text-gray-300 group-hover:text-purple-400 transition-colors" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Drawer */}
      {selectedRefund && (
        <RefundDrawer
          refund={selectedRefund}
          onClose={() => setSelectedRefund(null)}
          onRefresh={fetchRefunds}
        />
      )}
    </div>
  );
}
