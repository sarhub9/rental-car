'use client';

import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import toast from 'react-hot-toast';
import {
  HiOutlineLightBulb, HiXMark, HiOutlineEnvelope,
  HiOutlineCalendarDays, HiOutlineBuildingOffice2,
  HiOutlineCheckCircle, HiOutlineClock, HiOutlineNoSymbol,
  HiOutlineArrowPath, HiOutlineChevronRight,
} from 'react-icons/hi2';

const STATUS_ACTIONS = [
  { value: 'REVIEWING',   label: 'Under Review', icon: HiOutlineClock,        cls: 'bg-blue-600 hover:bg-blue-700 text-white' },
  { value: 'IMPLEMENTED', label: 'Mark Done',    icon: HiOutlineCheckCircle,  cls: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
  { value: 'DECLINED',    label: 'Decline',      icon: HiOutlineNoSymbol,     cls: 'bg-red-600 hover:bg-red-700 text-white' },
  { value: 'PENDING',     label: 'Re-open',      icon: HiOutlineArrowPath,    cls: 'bg-gray-100 hover:bg-gray-200 text-gray-700' },
];

const STATUS_CFG: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  PENDING:     { label: 'Pending',      dot: 'bg-yellow-400', bg: 'bg-yellow-50',  text: 'text-yellow-700' },
  REVIEWING:   { label: 'Under Review', dot: 'bg-blue-500',   bg: 'bg-blue-50',    text: 'text-blue-700' },
  IMPLEMENTED: { label: 'Completed',    dot: 'bg-emerald-500',bg: 'bg-emerald-50', text: 'text-emerald-700' },
  DECLINED:    { label: 'Declined',     dot: 'bg-red-500',    bg: 'bg-red-50',     text: 'text-red-700' },
  APPROVED:    { label: 'Approved',     dot: 'bg-emerald-500',bg: 'bg-emerald-50', text: 'text-emerald-700' },
  IN_PROGRESS: { label: 'In Progress',  dot: 'bg-blue-500',   bg: 'bg-blue-50',    text: 'text-blue-700' },
  COMPLETED:   { label: 'Completed',    dot: 'bg-emerald-500',bg: 'bg-emerald-50', text: 'text-emerald-700' },
  REJECTED:    { label: 'Rejected',     dot: 'bg-red-500',    bg: 'bg-red-50',     text: 'text-red-700' },
};

function StatusPill({ status }: { status: string }) {
  const c = STATUS_CFG[status] ?? { label: status, dot: 'bg-gray-400', bg: 'bg-gray-100', text: 'text-gray-600' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
      {c.label}
    </span>
  );
}

const FILTERS = ['ALL', 'PENDING', 'REVIEWING', 'IMPLEMENTED', 'DECLINED'];

export default function FeatureRequestsPage() {
  const [requests, setRequests]           = useState<any[]>([]);
  const [loading, setLoading]             = useState(true);
  const [filter, setFilter]               = useState('ALL');
  const [selected, setSelected]           = useState<any | null>(null);
  const [updating, setUpdating]           = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { limit: 100 };
      if (filter !== 'ALL') params.status = filter;
      const res = await apiClient.get('/v1/feature-requests', { params });
      const items = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setRequests(items);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const doUpdate = async (id: string, status: string) => {
    setUpdating(true);
    try {
      await apiClient.patch(`/v1/feature-requests/${id}/status`, { status });
      toast.success('Status updated');
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      setSelected((prev: any) => prev?.id === id ? { ...prev, status } : prev);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to update');
    } finally { setUpdating(false); }
  };

  const stats = {
    PENDING:     requests.filter(r => r.status === 'PENDING').length,
    REVIEWING:   requests.filter(r => r.status === 'REVIEWING').length,
    IMPLEMENTED: requests.filter(r => r.status === 'IMPLEMENTED').length,
    DECLINED:    requests.filter(r => r.status === 'DECLINED').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feature Requests</h1>
          <p className="text-sm text-gray-500 mt-0.5">{requests.length} total requests from companies</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(Object.entries(stats) as [string, number][]).map(([status, count]) => {
            const c = STATUS_CFG[status];
            const active = filter === status;
            return (
              <button key={status} onClick={() => setFilter(active ? 'ALL' : status)}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  active ? 'border-[#0E7490] shadow-md shadow-[#0E7490]/10' : 'border-gray-200 bg-white hover:border-gray-300'
                }`}>
                <p className="text-3xl font-bold text-gray-900 mb-1">{count}</p>
                <StatusPill status={status} />
              </button>
            );
          })}
        </div>

        {/* Filter + list */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

          {/* Filter bar */}
          <div className="flex items-center gap-1 px-4 py-3 border-b border-gray-100 overflow-x-auto">
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === f
                    ? 'bg-[#0E7490] text-white'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}>
                {f === 'ALL' ? 'All Requests' : STATUS_CFG[f]?.label || f}
              </button>
            ))}
          </div>

          {/* List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#0E7490] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-14 h-14 bg-yellow-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <HiOutlineLightBulb className="w-7 h-7 text-yellow-400" />
              </div>
              <p className="font-semibold text-gray-600">No requests found</p>
              <p className="text-sm text-gray-400 mt-1">Feature requests from companies will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {requests.map(req => (
                <button key={req.id} onClick={() => setSelected(req)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center flex-shrink-0">
                    <HiOutlineLightBulb className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{req.feature_title}</p>
                    <p className="text-sm text-gray-400 truncate mt-0.5">{req.message}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      {req.company_name && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <HiOutlineBuildingOffice2 className="w-3 h-3" /> {req.company_name}
                        </span>
                      )}
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <HiOutlineCalendarDays className="w-3 h-3" />
                        {new Date(req.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <StatusPill status={req.status} />
                    <HiOutlineChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#0E7490] transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Detail Drawer ── */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setSelected(null)} />
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">

            {/* Drawer header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-yellow-50 flex items-center justify-center">
                  <HiOutlineLightBulb className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Feature Request</p>
                  <p className="text-sm font-bold text-gray-900">Review & Update</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <HiXMark className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Drawer body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">

              {/* Title */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 leading-snug">{selected.feature_title}</h2>
                <div className="mt-2"><StatusPill status={selected.status} /></div>
              </div>

              {/* Description */}
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Description</p>
                <p className="text-sm text-gray-700 leading-relaxed">{selected.message}</p>
              </div>

              {/* Meta info */}
              <div className="space-y-3">
                {selected.company_name && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                      <HiOutlineBuildingOffice2 className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Company</p>
                      <p className="text-sm font-semibold text-gray-800">{selected.company_name}</p>
                    </div>
                  </div>
                )}
                {selected.contact_email && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                      <HiOutlineEnvelope className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Contact</p>
                      <p className="text-sm font-semibold text-gray-800">{selected.contact_email}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                    <HiOutlineCalendarDays className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Submitted</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {new Date(selected.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer footer — action buttons */}
            <div className="border-t border-gray-100 p-5 bg-gray-50">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Update Status</p>
              <div className="grid grid-cols-2 gap-2">
                {STATUS_ACTIONS.filter(a => a.value !== selected.status).map(action => {
                  const Icon = action.icon;
                  return (
                    <button key={action.value}
                      onClick={() => doUpdate(selected.id, action.value)}
                      disabled={updating}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${action.cls}`}>
                      {updating
                        ? <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                        : <Icon className="w-4 h-4" />
                      }
                      {action.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
