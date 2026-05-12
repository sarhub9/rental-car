'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiPlus, HiMagnifyingGlass, HiChevronRight,
  HiOutlineExclamationTriangle,
} from 'react-icons/hi2';
import { incidentService } from '@/services/incident.service';
import { extractApiError } from '@/lib/api-error';

const STATUS_OPTIONS = ['ALL', 'OPEN', 'UNDER_REVIEW', 'CLAIMED', 'SETTLED', 'CLOSED', 'REJECTED'];
const TYPE_OPTIONS   = ['ALL', 'ACCIDENT', 'THEFT', 'VANDALISM', 'FIRE', 'FLOOD', 'OTHER'];

const STATUS_BADGE: Record<string, string> = {
  OPEN:         'bg-red-100 text-red-700',
  UNDER_REVIEW: 'bg-amber-100 text-amber-700',
  CLAIMED:      'bg-blue-100 text-blue-700',
  SETTLED:      'bg-emerald-100 text-emerald-700',
  CLOSED:       'bg-gray-100 text-gray-500',
  REJECTED:     'bg-gray-100 text-gray-500',
};

export default function IncidentsPage() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter]     = useState('ALL');
  const [search, setSearch]             = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (typeFilter !== 'ALL') params.type = typeFilter;
      const res = await incidentService.listIncidents(params);
      setIncidents(Array.isArray(res) ? res : (res?.data || []));
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to load incidents'));
    } finally { setLoading(false); }
  }, [statusFilter, typeFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = incidents.filter(i =>
    !search ||
    (i.incident_number ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (i.plate_number ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (i.incident_type ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Incidents</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {incidents.length > 0 ? `${incidents.length} incident${incidents.length !== 1 ? 's' : ''}` : 'Accidents, theft & damage reports'}
          </p>
        </div>
        <button onClick={() => router.push('/incidents/create')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 shadow-sm transition-colors">
          <HiPlus className="w-5 h-5" /> Report Incident
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search incidents..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 bg-white" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 min-w-[150px]">
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s.replace(/_/g, ' ')}</option>)}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 min-w-[140px]">
          {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t === 'ALL' ? 'All Types' : t}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <HiOutlineExclamationTriangle className="w-7 h-7 text-red-400" />
            </div>
            <p className="font-semibold text-gray-700">No incidents found</p>
            <p className="text-sm text-gray-400 mt-1">Report an incident to get started</p>
            <button onClick={() => router.push('/incidents/create')}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700">
              <HiPlus className="w-4 h-4" /> Report Incident
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Incident #</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vehicle</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Location</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(inc => {
                const badgeClass = STATUS_BADGE[inc.status] || 'bg-gray-100 text-gray-500';
                return (
                  <tr key={inc.id} onClick={() => router.push(`/incidents/${inc.id}`)}
                    className="hover:bg-red-50/30 cursor-pointer transition-colors group">
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs text-gray-700">{inc.incident_number ?? inc.id?.slice(0, 8)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-semibold text-gray-900 font-mono">{inc.plate_number ?? inc.vehicle?.plate_number ?? '—'}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-gray-700">{inc.incident_type ?? '—'}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badgeClass}`}>
                        {(inc.status ?? '—').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {inc.incident_datetime
                        ? new Date(inc.incident_datetime).toLocaleDateString()
                        : inc.created_at ? new Date(inc.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500 max-w-xs truncate">{inc.location || '—'}</td>
                    <td className="px-5 py-4">
                      <HiChevronRight className="w-4 h-4 text-gray-300 group-hover:text-red-500 transition-colors" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
