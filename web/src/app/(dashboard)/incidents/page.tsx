'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiOutlineExclamationTriangle,
  HiOutlinePlusCircle,
  HiOutlineFunnel,
  HiOutlineChevronDown,
  HiOutlineMagnifyingGlass,
  HiOutlineUser,
  HiOutlineTruck,
  HiOutlineDocumentText,
} from 'react-icons/hi2';
import { incidentService } from '@/services/incident.service';
import { customerService } from '@/services/customer.service';
import { vehicleService } from '@/services/vehicle.service';
import { getAgreements } from '@/services/agreement.service';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { Modal } from '@/components/Modal';
import { Spinner } from '@/components/Spinner';
import { cleanPayload } from '@/lib/clean-payload';
import { extractApiError } from '@/lib/api-error';

const STATUS_OPTIONS = ['ALL', 'OPEN', 'UNDER_REVIEW', 'CLAIMED', 'SETTLED', 'CLOSED', 'REJECTED'];
const TYPE_OPTIONS = ['ALL', 'ACCIDENT', 'THEFT', 'VANDALISM', 'FIRE', 'FLOOD', 'OTHER'];

const emptyForm = {
  vehicle_id: '',
  customer_id: '',
  agreement_id: '',
  incident_type: 'ACCIDENT',
  description: '',
  location: '',
  incident_datetime: '',
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

  // Vehicle search
  const [allVehicles, setAllVehicles] = useState<any[]>([]);
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [showVehicleDrop, setShowVehicleDrop] = useState(false);
  const vehicleRef = useRef<HTMLDivElement>(null);

  // Customer search
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showCustomerDrop, setShowCustomerDrop] = useState(false);
  const customerRef = useRef<HTMLDivElement>(null);

  // Agreement search
  const [allAgreements, setAllAgreements] = useState<any[]>([]);
  const [agreementSearch, setAgreementSearch] = useState('');
  const [selectedAgreement, setSelectedAgreement] = useState<any>(null);
  const [showAgreementDrop, setShowAgreementDrop] = useState(false);
  const agreementRef = useRef<HTMLDivElement>(null);

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

  // Load lookup data when modal opens
  useEffect(() => {
    if (!showCreateModal) return;
    setForm({ ...emptyForm });
    setVehicleSearch(''); setSelectedVehicle(null);
    setCustomerSearch(''); setCustomers([]); setSelectedCustomer(null);
    setAgreementSearch(''); setSelectedAgreement(null);

    vehicleService.getVehicles({ limit: 200 })
      .then(d => setAllVehicles(Array.isArray(d) ? d : (d?.data || [])))
      .catch(() => {});

    getAgreements({ limit: 100 })
      .then(d => {
        const items = Array.isArray(d) ? d : (d?.data || []);
        setAllAgreements(items);
      })
      .catch(() => {});
  }, [showCreateModal]);

  // Customer search debounce
  useEffect(() => {
    if (!customerSearch.trim()) { setCustomers([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await customerService.searchCustomers(customerSearch);
        setCustomers(Array.isArray(res) ? res : (res?.data || []));
      } catch { setCustomers([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [customerSearch]);

  // Outside click to close dropdowns
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (vehicleRef.current && !vehicleRef.current.contains(e.target as Node)) setShowVehicleDrop(false);
      if (customerRef.current && !customerRef.current.contains(e.target as Node)) setShowCustomerDrop(false);
      if (agreementRef.current && !agreementRef.current.contains(e.target as Node)) setShowAgreementDrop(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredVehicles = allVehicles.filter(v => {
    if (!vehicleSearch.trim()) return true;
    const q = vehicleSearch.toLowerCase();
    return (
      (v.plate_number ?? '').toLowerCase().includes(q) ||
      (v.make ?? '').toLowerCase().includes(q) ||
      (v.model ?? '').toLowerCase().includes(q)
    );
  });

  const filteredAgreements = allAgreements.filter(a => {
    if (!agreementSearch.trim()) return true;
    const q = agreementSearch.toLowerCase();
    return (
      (a.agreement_number ?? '').toLowerCase().includes(q) ||
      (a.customer_name ?? '').toLowerCase().includes(q) ||
      (a.plate_number ?? '').toLowerCase().includes(q)
    );
  });

  const handleCreate = async () => {
    if (!form.vehicle_id) { toast.error('Please select a vehicle'); return; }
    if (!form.customer_id) { toast.error('Please select a customer'); return; }
    if (!form.agreement_id) { toast.error('Please select an agreement'); return; }
    if (!form.description.trim()) { toast.error('Description is required'); return; }
    if (!form.incident_datetime) { toast.error('Incident date & time is required'); return; }
    try {
      setSubmitting(true);
      await incidentService.createIncident(cleanPayload(form));
      toast.success('Incident reported');
      setShowCreateModal(false);
      fetchIncidents();
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to report incident'));
    } finally {
      setSubmitting(false);
    }
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
      render: (row: any) => row.plate_number ?? row.vehicle?.plate_number ?? '—',
    },
    {
      header: 'Type',
      render: (row: any) => (
        <span className="capitalize text-sm text-gray-700">{(row.incident_type ?? '').replace(/_/g, ' ')}</span>
      ),
    },
    {
      header: 'Status',
      render: (row: any) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Date',
      render: (row: any) =>
        row.incident_datetime
          ? new Date(row.incident_datetime).toLocaleDateString()
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
          onClick={() => setShowCreateModal(true)}
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

          {/* Vehicle */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Vehicle <span className="text-red-500">*</span>
            </label>
            <div className="relative" ref={vehicleRef}>
              <HiOutlineTruck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={vehicleSearch}
                onChange={(e) => { setVehicleSearch(e.target.value); setShowVehicleDrop(true); setSelectedVehicle(null); setForm(f => ({ ...f, vehicle_id: '' })); }}
                onFocus={() => setShowVehicleDrop(true)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search by plate, make or model..."
              />
              {showVehicleDrop && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {filteredVehicles.length > 0 ? filteredVehicles.map((v: any) => (
                    <button key={v.id} type="button"
                      onClick={() => { setSelectedVehicle(v); setForm(f => ({ ...f, vehicle_id: v.id })); setVehicleSearch(`${v.make} ${v.model} — ${v.plate_number}`); setShowVehicleDrop(false); }}
                      className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 text-sm">
                      <span className="font-medium text-gray-900">{v.make} {v.model} <span className="text-gray-400">({v.year})</span></span>
                      <span className="font-mono text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{v.plate_number}</span>
                    </button>
                  )) : (
                    <p className="px-3 py-2 text-sm text-gray-400">{allVehicles.length === 0 ? 'No vehicles found' : 'No match'}</p>
                  )}
                </div>
              )}
              {selectedVehicle && <p className="text-xs text-green-600 mt-1">✓ {selectedVehicle.make} {selectedVehicle.model} — {selectedVehicle.plate_number}</p>}
            </div>
          </div>

          {/* Customer */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Customer <span className="text-red-500">*</span>
            </label>
            <div className="relative" ref={customerRef}>
              <HiOutlineUser className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerDrop(true); setSelectedCustomer(null); setForm(f => ({ ...f, customer_id: '' })); }}
                onFocus={() => setShowCustomerDrop(true)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search by name or phone..."
              />
              {showCustomerDrop && customers.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {customers.map((c: any) => (
                    <button key={c.id} type="button"
                      onClick={() => { setSelectedCustomer(c); setForm(f => ({ ...f, customer_id: c.id })); setCustomerSearch(c.full_name_en ?? c.full_name ?? c.name ?? ''); setShowCustomerDrop(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 text-sm">
                      <HiOutlineUser className="h-4 w-4 text-gray-400 shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">{c.full_name_en ?? c.full_name ?? c.name}</p>
                        <p className="text-xs text-gray-500">{c.phone_number ?? c.email ?? ''}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {selectedCustomer && <p className="text-xs text-green-600 mt-1">✓ {selectedCustomer.full_name_en ?? selectedCustomer.full_name}</p>}
            </div>
          </div>

          {/* Agreement */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Agreement <span className="text-red-500">*</span>
            </label>
            <div className="relative" ref={agreementRef}>
              <HiOutlineDocumentText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={agreementSearch}
                onChange={(e) => { setAgreementSearch(e.target.value); setShowAgreementDrop(true); setSelectedAgreement(null); setForm(f => ({ ...f, agreement_id: '' })); }}
                onFocus={() => setShowAgreementDrop(true)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search by agreement number or plate..."
              />
              {showAgreementDrop && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {filteredAgreements.length > 0 ? filteredAgreements.map((a: any) => (
                    <button key={a.id} type="button"
                      onClick={() => { setSelectedAgreement(a); setForm(f => ({ ...f, agreement_id: a.id })); setAgreementSearch(a.agreement_number ?? a.id.slice(0, 8)); setShowAgreementDrop(false); }}
                      className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 text-sm">
                      <span className="font-mono text-xs font-medium text-gray-900">{a.agreement_number ?? a.id.slice(0, 8)}</span>
                      <span className="text-xs text-gray-500">{a.customer_name ?? ''} {a.plate_number ? `· ${a.plate_number}` : ''}</span>
                    </button>
                  )) : (
                    <p className="px-3 py-2 text-sm text-gray-400">{allAgreements.length === 0 ? 'No agreements found' : 'No match'}</p>
                  )}
                </div>
              )}
              {selectedAgreement && <p className="text-xs text-green-600 mt-1">✓ {selectedAgreement.agreement_number ?? selectedAgreement.id.slice(0, 8)}</p>}
            </div>
          </div>

          {/* Type + Datetime */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Type</label>
              <div className="relative">
                <select
                  value={form.incident_type}
                  onChange={(e) => setForm({ ...form, incident_type: e.target.value })}
                  className="appearance-none w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  {TYPE_OPTIONS.filter(t => t !== 'ALL').map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <HiOutlineChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Incident Date &amp; Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={form.incident_datetime}
                onChange={(e) => setForm({ ...form, incident_datetime: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Location</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. Sheikh Zayed Rd, Dubai"
            />
          </div>

          {/* Description */}
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
