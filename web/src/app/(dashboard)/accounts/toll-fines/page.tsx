'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  HiMagnifyingGlass, HiChevronRight, HiXMark,
  HiOutlineArrowUpTray, HiOutlineArrowPath, HiOutlineLink,
} from 'react-icons/hi2';
import { accountsService } from '@/services/accounts.service';
import { extractApiError } from '@/lib/api-error';

const ATTRIBUTION_BADGE: Record<string, string> = {
  matched:   'bg-emerald-100 text-emerald-700',
  unmatched: 'bg-amber-100 text-amber-700',
  disputed:  'bg-red-100 text-red-700',
};

// ── Assign Drawer ─────────────────────────────────────────────────────────────
function AssignDrawer({ open, onClose, fine, onSaved }: {
  open: boolean; onClose: () => void; fine: any | null; onSaved: () => void;
}) {
  const [agreementId, setAgreementId] = useState('');
  const [submitting, setSubmitting]   = useState(false);

  useEffect(() => { if (open) setAgreementId(''); }, [open]);

  if (!fine) return null;

  const handleAssign = async () => {
    if (!agreementId.trim()) { toast.error('Agreement ID is required'); return; }
    setSubmitting(true);
    try {
      await accountsService.assignTollFine(fine.id, agreementId);
      toast.success('Fine assigned successfully');
      onSaved(); onClose();
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to assign fine'));
    } finally { setSubmitting(false); }
  };

  const attrBadge = ATTRIBUTION_BADGE[fine.attribution_status] || 'bg-gray-100 text-gray-500';

  return (
    <>
      <div onClick={onClose}
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <HiOutlineLink className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Fine Details</h2>
              <p className="text-xs text-gray-500 font-mono">{fine.plate_number ?? '—'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-200 transition-colors">
            <HiXMark className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">Fine Info</p>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Plate</span>
                <span className="text-sm font-bold font-mono text-gray-900">{fine.plate_number ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Type</span>
                <span className="text-sm font-semibold text-gray-900 capitalize">{(fine.type ?? '').replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Amount</span>
                <span className="text-sm font-bold text-gray-900">AED {Number(fine.amount ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Date</span>
                <span className="text-sm text-gray-700">{fine.fine_date ? new Date(fine.fine_date).toLocaleDateString() : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Location</span>
                <span className="text-sm text-gray-700 text-right max-w-[60%]">{fine.location ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Attribution</span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${attrBadge}`}>
                  {fine.attribution_status ?? '—'}
                </span>
              </div>
              {fine.agreement_number && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Agreement</span>
                  <span className="text-sm font-mono font-semibold text-gray-900">{fine.agreement_number}</span>
                </div>
              )}
            </div>
          </div>

          {fine.attribution_status !== 'matched' && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">Assign to Agreement</p>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Agreement ID</label>
              <input type="text" value={agreementId} onChange={e => setAgreementId(e.target.value)}
                placeholder="Enter agreement ID"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white" />
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          {fine.attribution_status !== 'matched' ? (
            <div className="flex gap-3">
              <button onClick={onClose}
                className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleAssign} disabled={submitting || !agreementId.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50">
                {submitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {submitting ? 'Assigning...' : 'Assign Fine'}
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
export default function TollFinesPage() {
  const [fines, setFines]               = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [activeTab, setActiveTab]       = useState<'all' | 'unmatched'>('all');
  const [typeFilter, setTypeFilter]     = useState('ALL');
  const [attrFilter, setAttrFilter]     = useState('ALL');
  const [search, setSearch]             = useState('');
  const [drawerOpen, setDrawerOpen]     = useState(false);
  const [selected, setSelected]         = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (activeTab === 'unmatched') params.unmatched = 'true';
      if (typeFilter !== 'ALL') params.type = typeFilter;
      if (attrFilter !== 'ALL') params.attribution_status = attrFilter;
      const res = await accountsService.getTollFines(params);
      setFines(Array.isArray(res) ? res : (res?.data ?? []));
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to load toll fines'));
    } finally { setLoading(false); }
  }, [activeTab, typeFilter, attrFilter]);

  useEffect(() => { load(); }, [load]);

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append('file', file);
      await accountsService.importTollFines(fd);
      toast.success('CSV imported successfully');
      load();
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to import CSV'));
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleReprocess = async () => {
    try {
      await accountsService.reprocessTollFines();
      toast.success('Reprocessing started');
      load();
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to reprocess'));
    }
  };

  const filtered = fines.filter(f =>
    !search ||
    (f.plate_number ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (f.location ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (f.agreement_number ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Toll & Fines</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {fines.length > 0 ? `${fines.length} fine${fines.length !== 1 ? 's' : ''}` : 'Salik, traffic & parking fines'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 shadow-sm transition-colors">
            <HiOutlineArrowUpTray className="w-4 h-4" /> Import CSV
          </button>
          <button onClick={handleReprocess}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 shadow-sm transition-colors">
            <HiOutlineArrowPath className="w-4 h-4" /> Reprocess
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {[{ key: 'all', label: 'All' }, { key: 'unmatched', label: 'Unmatched' }].map(({ key, label }) => (
          <button key={key} onClick={() => setActiveTab(key as any)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search by plate or location..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 bg-white" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 min-w-[150px]">
          <option value="ALL">All Types</option>
          <option value="salik">Salik</option>
          <option value="traffic_fine">Traffic Fine</option>
          <option value="parking_fine">Parking Fine</option>
        </select>
        <select value={attrFilter} onChange={e => setAttrFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 min-w-[160px]">
          <option value="ALL">All Attribution</option>
          <option value="matched">Matched</option>
          <option value="unmatched">Unmatched</option>
          <option value="disputed">Disputed</option>
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
            <p className="font-semibold text-gray-700">No fines found</p>
            <p className="text-sm text-gray-400 mt-1">Import a CSV to add fines</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Plate</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Location</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Attribution</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Agreement</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(f => {
                const attrBadge = ATTRIBUTION_BADGE[f.attribution_status] || 'bg-gray-100 text-gray-500';
                return (
                  <tr key={f.id} onClick={() => { setSelected(f); setDrawerOpen(true); }}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors group">
                    <td className="px-5 py-4">
                      <span className="font-mono text-sm font-semibold text-gray-900">{f.plate_number ?? '—'}</span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700 capitalize">{(f.type ?? '').replace(/_/g, ' ')}</td>
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {f.fine_date ? new Date(f.fine_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-semibold text-gray-900">AED {Number(f.amount ?? 0).toLocaleString()}</span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500 max-w-[150px] truncate">{f.location ?? '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${attrBadge}`}>
                        {f.attribution_status ?? '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600 font-mono">{f.agreement_number ?? f.agreement_id ?? '—'}</td>
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

      <AssignDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        fine={selected}
        onSaved={load}
      />
    </div>
  );
}
