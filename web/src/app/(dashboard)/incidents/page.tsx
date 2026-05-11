'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiOutlineExclamationTriangle,
  HiOutlinePlusCircle,
  HiOutlineFunnel,
  HiOutlineChevronDown,
} from 'react-icons/hi2';
import { incidentService } from '@/services/incident.service';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { Modal } from '@/components/Modal';
import { Spinner } from '@/components/Spinner';
import { cleanPayload } from '@/lib/clean-payload';
import { extractApiError } from '@/lib/api-error';

const STATUS_OPTIONS = ['ALL', 'OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED'];
const TYPE_OPTIONS = ['ALL', 'accident', 'theft', 'damage', 'vandalism', 'other'];
const SEVERITY_OPTIONS = ['minor', 'moderate', 'severe', 'total_loss'];

const emptyForm = {
  vehicle_id: '',
  agreement_id: '',
  type: 'accident',
  severity: 'minor',
  description: '',
  location: '',
  incident_date: '',
};

export default function IncidentsPage() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { router.prefetch('/incidents'); }, [router]);

  const fetchIncidents = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (typeFilter !== 'ALL') params.type = typeFilter;
      const res = await incidentService.listIncidents(params);
      setIncidents(Array.isArray(res) ? res : (res?.data || []));
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to load incidents'));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter]);

  useEffect(() => { fetchIncidents(); }, [fetchIncidents]);

  const handleCreate = async () => {
    if (!form.vehicle_id.trim() || !form.description.trim()) {
      toast.error('Vehicle ID and description are required');
      return;
    }
    try {
      setSubmitting(true);
      await incidentService.createIncident(cleanPayload(form));
      toast.success('Incident reported');
      setShowCreateModal(false);
      setForm({ ...emptyForm });
      fetchIncidents();
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to report incident'));
    } finally {
      setSubmitting(false);
    }
  };

  const sevColor: Record<string, string> = {
    minor: 'bg-yellow-100 text-yellow-700',
    moderate: 'bg-orange-100 text-orange-700',
    severe: 'bg-red-100 text-red-700',
    total_loss: 'bg-red-900/10 text-red-900',
  };

  const columns = [
    {
      header: 'Incident #',
      render: (row: any) => (
        <span className="font-mono text-xs text-gray-700">{row.incident_number ?? row.id?.slice(0, 8)}</span>
      ),
    },
    {
      header: 'Vehicle',
      render: (row: any) => row.vehicle?.plate_number ?? row.vehicle_plate ?? row.vehicle_id?.slice(0, 8) ?? '—',
    },
    {
      header: 'Type',
      render: (row: any) => (
        <span className="capitalize text-sm text-gray-700">{(row.type ?? '').replace(/_/g, ' ')}</span>
      ),
    },
    {
      header: 'Severity',
      render: (row: any) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${sevColor[row.severity] ?? 'bg-gray-100 text-gray-700'}`}>
          {(row.severity ?? '').replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (row: any) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Date',
      render: (row: any) =>
        row.incident_date
          ? new Date(row.incident_date).toLocaleDateString()
          : row.created_at
          ? new Date(row.created_at).toLocaleDateString()
          : '—',
    },
    {
      header: '',
      render: (row: any) => (
        <button
          onClick={(e) => { e.stopPropagation(); router.push(`/incidents/${row.id}`); }}
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
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
            <HiOutlineExclamationTriangle className="h-5 w-5 text-red-500" />
          </div>
          <PageHeader title="Incidents" />
        </div>
        <button
          onClick={() => { setForm({ ...emptyForm }); setShowCreateModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <HiOutlinePlusCircle className="h-5 w-5" />
          Report Incident
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-wrap items-center gap-4">
        <HiOutlineFunnel className="h-5 w-5 text-gray-400" />
        {[
          { label: 'Status', value: statusFilter, onChange: setStatusFilter, options: STATUS_OPTIONS },
          { label: 'Type', value: typeFilter, onChange: setTypeFilter, options: TYPE_OPTIONS },
        ].map(({ label, value, onChange, options }) => (
          <div key={label}>
            <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
            <div className="relative">
              <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="appearance-none border border-gray-300 rounded-lg px-3 py-1.5 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white capitalize"
              >
                {options.map((o) => (
                  <option key={o} value={o}>{o === 'ALL' ? `All ${label}s` : o.replace(/_/g, ' ')}</option>
                ))}
              </select>
              <HiOutlineChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <DataTable
          columns={columns}
          data={incidents}
          onRowClick={(row: any) => router.push(`/incidents/${row.id}`)}
          emptyMessage="No incidents reported."
        />
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Report Incident">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Vehicle ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.vehicle_id}
              onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Vehicle UUID"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Agreement ID (optional)</label>
            <input
              type="text"
              value={form.agreement_id}
              onChange={(e) => setForm({ ...form, agreement_id: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Agreement UUID"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Type</label>
              <div className="relative">
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="appearance-none w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white capitalize"
                >
                  {TYPE_OPTIONS.filter(t => t !== 'ALL').map((t) => (
                    <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                  ))}
                </select>
                <HiOutlineChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Severity</label>
              <div className="relative">
                <select
                  value={form.severity}
                  onChange={(e) => setForm({ ...form, severity: e.target.value })}
                  className="appearance-none w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white capitalize"
                >
                  {SEVERITY_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                  ))}
                </select>
                <HiOutlineChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Incident Date</label>
              <input
                type="date"
                value={form.incident_date}
                onChange={(e) => setForm({ ...form, incident_date: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. Sheikh Zayed Rd"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder="Describe what happened..."
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
              {submitting ? 'Reporting...' : 'Report Incident'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
