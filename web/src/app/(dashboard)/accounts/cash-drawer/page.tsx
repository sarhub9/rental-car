'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  HiOutlineBanknotes,
  HiOutlinePlusCircle,
  HiOutlineXCircle,
  HiOutlineDocumentText,
} from 'react-icons/hi2';
import { cashDrawerService } from '@/services/cash-drawer.service';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { Modal } from '@/components/Modal';
import { Spinner } from '@/components/Spinner';
import { cleanPayload } from '@/lib/clean-payload';
import { extractApiError } from '@/lib/api-error';

export default function CashDrawerPage() {
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [showOpenModal, setShowOpenModal] = useState(false);
  const [openingBalance, setOpeningBalance] = useState('');
  const [openNotes, setOpenNotes] = useState('');

  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closingBalance, setClosingBalance] = useState('');
  const [closeNotes, setCloseNotes] = useState('');

  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [currentRes, sessionsRes] = await Promise.allSettled([
        cashDrawerService.getCurrentSession(),
        cashDrawerService.listCashDrawerSessions(),
      ]);

      if (currentRes.status === 'fulfilled') {
        const data = currentRes.value?.data ?? currentRes.value;
        setCurrentSession(data?.id ? data : null);
      }
      if (sessionsRes.status === 'fulfilled') {
        const data = sessionsRes.value;
        setSessions(Array.isArray(data) ? data : (data?.data || []));
      }
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to load cash drawer data'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleOpen = async () => {
    if (!openingBalance) { toast.error('Opening balance is required'); return; }
    try {
      setSubmitting(true);
      await cashDrawerService.openCashDrawerSession(
        cleanPayload({ opening_balance: Number(openingBalance), notes: openNotes || undefined }) as any
      );
      toast.success('Cash drawer opened');
      setShowOpenModal(false);
      setOpeningBalance('');
      setOpenNotes('');
      fetchData();
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to open cash drawer'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = async () => {
    if (!closingBalance) { toast.error('Closing balance is required'); return; }
    if (!currentSession?.id) return;
    try {
      setSubmitting(true);
      await cashDrawerService.closeSession(
        currentSession.id,
        cleanPayload({ closing_balance: Number(closingBalance), notes: closeNotes || undefined }) as any
      );
      toast.success('Cash drawer closed');
      setShowCloseModal(false);
      setClosingBalance('');
      setCloseNotes('');
      fetchData();
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to close cash drawer'));
    } finally {
      setSubmitting(false);
    }
  };

  const openSummary = async (session: any) => {
    try {
      setLoadingSummary(true);
      setShowSummaryModal(true);
      setSummaryData(null);
      const res = await cashDrawerService.getSessionSummary(session.id);
      setSummaryData(res?.data ?? res);
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to load summary'));
      setShowSummaryModal(false);
    } finally {
      setLoadingSummary(false);
    }
  };

  const columns = [
    {
      header: 'Session #',
      render: (row: any) => (
        <span className="font-mono text-xs text-gray-700">{row.session_number ?? row.id?.slice(0, 8)}</span>
      ),
    },
    {
      header: 'Opened By',
      render: (row: any) => row.opened_by?.full_name ?? row.opened_by_name ?? '—',
    },
    {
      header: 'Opened At',
      render: (row: any) => row.opened_at ? new Date(row.opened_at).toLocaleString() : '—',
    },
    {
      header: 'Closed At',
      render: (row: any) => row.closed_at ? new Date(row.closed_at).toLocaleString() : '—',
    },
    {
      header: 'Opening Balance',
      render: (row: any) =>
        row.opening_balance != null ? `AED ${Number(row.opening_balance).toLocaleString()}` : '—',
    },
    {
      header: 'Closing Balance',
      render: (row: any) =>
        row.closing_balance != null ? `AED ${Number(row.closing_balance).toLocaleString()}` : '—',
    },
    {
      header: 'Status',
      render: (row: any) => <StatusBadge status={row.status ?? (row.closed_at ? 'CLOSED' : 'OPEN')} />,
    },
    {
      header: '',
      render: (row: any) => (
        <button
          onClick={(e) => { e.stopPropagation(); openSummary(row); }}
          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          <HiOutlineDocumentText className="h-4 w-4" />
          Summary
        </button>
      ),
    },
  ];

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
          <HiOutlineBanknotes className="h-5 w-5 text-emerald-600" />
        </div>
        <PageHeader title="Cash Drawer" />
      </div>

      {/* Current Session Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Current Session</h2>
        {currentSession ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500">Session #</p>
                <p className="text-sm font-medium text-gray-900 font-mono">
                  {currentSession.session_number ?? currentSession.id?.slice(0, 8)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Opened At</p>
                <p className="text-sm text-gray-900">
                  {currentSession.opened_at ? new Date(currentSession.opened_at).toLocaleString() : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Opened By</p>
                <p className="text-sm text-gray-900">
                  {currentSession.opened_by?.full_name ?? currentSession.opened_by_name ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Opening Balance</p>
                <p className="text-sm font-medium text-gray-900">
                  AED {Number(currentSession.opening_balance ?? 0).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setClosingBalance(''); setCloseNotes(''); setShowCloseModal(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
              >
                <HiOutlineXCircle className="h-5 w-5" />
                Close Session
              </button>
              <button
                onClick={() => openSummary(currentSession)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                <HiOutlineDocumentText className="h-5 w-5" />
                View Summary
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 space-y-3">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto">
              <HiOutlineBanknotes className="h-7 w-7 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">No open session. Start a new session to begin processing payments.</p>
            <button
              onClick={() => { setOpeningBalance(''); setOpenNotes(''); setShowOpenModal(true); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              <HiOutlinePlusCircle className="h-5 w-5" />
              Open Session
            </button>
          </div>
        )}
      </div>

      {/* Sessions History */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Session History</h2>
        <DataTable columns={columns} data={sessions} emptyMessage="No sessions recorded." />
      </div>

      {/* Open Modal */}
      <Modal isOpen={showOpenModal} onClose={() => setShowOpenModal(false)} title="Open Cash Drawer">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Opening Balance (AED) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Notes (optional)</label>
            <input
              type="text"
              value={openNotes}
              onChange={(e) => setOpenNotes(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Opening notes..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowOpenModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
            <button
              onClick={handleOpen}
              disabled={submitting}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              {submitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {submitting ? 'Opening...' : 'Open Drawer'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Close Modal */}
      <Modal isOpen={showCloseModal} onClose={() => setShowCloseModal(false)} title="Close Cash Drawer">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Closing Balance (AED) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={closingBalance}
              onChange={(e) => setClosingBalance(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Notes (optional)</label>
            <input
              type="text"
              value={closeNotes}
              onChange={(e) => setCloseNotes(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Closing notes..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowCloseModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
            <button
              onClick={handleClose}
              disabled={submitting}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
            >
              {submitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {submitting ? 'Closing...' : 'Close Drawer'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Summary Modal */}
      <Modal isOpen={showSummaryModal} onClose={() => setShowSummaryModal(false)} title="Session Summary">
        {loadingSummary ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : summaryData ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Opening Balance', value: summaryData.opening_balance },
                { label: 'Closing Balance', value: summaryData.closing_balance },
                { label: 'Total Cash In', value: summaryData.total_cash_in ?? summaryData.total_in },
                { label: 'Total Cash Out', value: summaryData.total_cash_out ?? summaryData.total_out },
                { label: 'Net', value: summaryData.net ?? summaryData.difference },
                { label: 'Transactions', value: summaryData.transaction_count ?? summaryData.count },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">
                    {value != null
                      ? (typeof value === 'number' || !isNaN(Number(value))
                        ? `AED ${Number(value).toLocaleString()}`
                        : String(value))
                      : '—'}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={() => setShowSummaryModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Close</button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 py-4 text-center">No summary data available.</p>
        )}
      </Modal>
    </div>
  );
}
