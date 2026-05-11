'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowUturnLeft,
  HiOutlinePlusCircle,
  HiOutlineFunnel,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineBanknotes,
  HiOutlineChevronDown,
} from 'react-icons/hi2';
import { refundService } from '@/services/refund.service';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { Modal } from '@/components/Modal';
import { Spinner } from '@/components/Spinner';
import { cleanPayload } from '@/lib/clean-payload';
import { extractApiError } from '@/lib/api-error';

const STATUS_OPTIONS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'PROCESSED'];

const emptyForm = {
  payment_id: '',
  customer_id: '',
  invoice_id: '',
  amount: '',
  reason: '',
};

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [submitting, setSubmitting] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedRefund, setSelectedRefund] = useState<any>(null);

  const [showProcessModal, setShowProcessModal] = useState(false);

  const fetchRefunds = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const res = await refundService.listRefunds(params);
      setRefunds(Array.isArray(res) ? res : (res?.data || []));
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to load refunds'));
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchRefunds(); }, [fetchRefunds]);

  const handleCreate = async () => {
    if (!form.payment_id.trim()) { toast.error('Payment ID is required'); return; }
    if (!form.customer_id.trim()) { toast.error('Customer ID is required'); return; }
    if (!form.amount) { toast.error('Amount is required'); return; }
    try {
      setSubmitting(true);
      await refundService.requestRefund(cleanPayload({ ...form, amount: Number(form.amount) }));
      toast.success('Refund requested');
      setShowCreateModal(false);
      setForm({ ...emptyForm });
      fetchRefunds();
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to request refund'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (refund: any) => {
    try {
      setSubmitting(true);
      await refundService.approveRefund(refund.id);
      toast.success('Refund approved');
      fetchRefunds();
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to approve refund'));
    } finally {
      setSubmitting(false);
    }
  };

  const openReject = (refund: any) => {
    setSelectedRefund(refund);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { toast.error('Rejection reason is required'); return; }
    try {
      setSubmitting(true);
      await refundService.rejectRefund(selectedRefund.id, rejectReason);
      toast.success('Refund rejected');
      setShowRejectModal(false);
      fetchRefunds();
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to reject refund'));
    } finally {
      setSubmitting(false);
    }
  };

  const openProcess = (refund: any) => {
    setSelectedRefund(refund);
    setShowProcessModal(true);
  };

  const handleProcess = async () => {
    try {
      setSubmitting(true);
      await refundService.processRefund(selectedRefund.id);
      toast.success('Refund processed');
      setShowProcessModal(false);
      fetchRefunds();
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to process refund'));
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Ref #',
      render: (row: any) => (
        <span className="font-mono text-xs text-gray-700">{row.refund_number ?? row.id?.slice(0, 8)}</span>
      ),
    },
    {
      header: 'Invoice',
      render: (row: any) => (
        <span className="font-mono text-xs">{row.invoice?.invoice_number ?? row.invoice_id?.slice(0, 8) ?? '—'}</span>
      ),
    },
    {
      header: 'Amount',
      render: (row: any) => (
        <span className="font-medium">AED {Number(row.amount ?? 0).toLocaleString()}</span>
      ),
    },
    {
      header: 'Method',
      render: (row: any) => (
        <span className="capitalize text-sm text-gray-600">{(row.method ?? '').replace(/_/g, ' ')}</span>
      ),
    },
    {
      header: 'Status',
      render: (row: any) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Requested',
      render: (row: any) => row.created_at ? new Date(row.created_at).toLocaleDateString() : '—',
    },
    {
      header: 'Actions',
      render: (row: any) => (
        <div className="flex items-center gap-1.5">
          {row.status === 'PENDING' && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); handleApprove(row); }}
                disabled={submitting}
                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Approve"
              >
                <HiOutlineCheckCircle className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); openReject(row); }}
                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Reject"
              >
                <HiOutlineXCircle className="h-4 w-4" />
              </button>
            </>
          )}
          {row.status === 'APPROVED' && (
            <button
              onClick={(e) => { e.stopPropagation(); openProcess(row); }}
              className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded hover:bg-blue-200"
            >
              <HiOutlineBanknotes className="h-3.5 w-3.5" />
              Process
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
            <HiOutlineArrowUturnLeft className="h-5 w-5 text-purple-600" />
          </div>
          <PageHeader title="Refunds" />
        </div>
        <button
          onClick={() => { setForm({ ...emptyForm }); setShowCreateModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <HiOutlinePlusCircle className="h-5 w-5" />
          Request Refund
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-wrap items-center gap-4">
        <HiOutlineFunnel className="h-5 w-5 text-gray-400" />
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none border border-gray-300 rounded-lg px-3 py-1.5 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s}</option>
              ))}
            </select>
            <HiOutlineChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <DataTable columns={columns} data={refunds} emptyMessage="No refunds found." />
      )}

      {/* Request Refund Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Request Refund">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Payment ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.payment_id}
                onChange={(e) => setForm({ ...form, payment_id: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Payment UUID"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Customer ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.customer_id}
                onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Customer UUID"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Invoice ID (optional)</label>
            <input
              type="text"
              value={form.invoice_id}
              onChange={(e) => setForm({ ...form, invoice_id: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Invoice UUID"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Amount (AED) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Reason</label>
            <textarea
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder="Reason for refund..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
            <button
              onClick={handleCreate}
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {submitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)} title="Reject Refund">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder="Explain why this refund is being rejected..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowRejectModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
            <button
              onClick={handleReject}
              disabled={submitting}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? 'Rejecting...' : 'Reject Refund'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Process Confirm Modal */}
      <Modal isOpen={showProcessModal} onClose={() => setShowProcessModal(false)} title="Process Refund">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Mark refund of <strong>AED {Number(selectedRefund?.amount ?? 0).toLocaleString()}</strong> as processed/paid?
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowProcessModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
            <button
              onClick={handleProcess}
              disabled={submitting}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {submitting ? 'Processing...' : 'Confirm Processed'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
