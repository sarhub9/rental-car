'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiOutlineCalendarDays,
  HiOutlinePlusCircle,
  HiOutlineFunnel,
  HiOutlineChevronDown,
  HiOutlineMagnifyingGlass,
  HiOutlineUser,
} from 'react-icons/hi2';
import { reservationService } from '@/services/reservation.service';
import { customerService } from '@/services/customer.service';
import { branchService } from '@/services/branch.service';
import { vehicleCategoryService } from '@/services/vehicle-category.service';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { Modal } from '@/components/Modal';
import { Spinner } from '@/components/Spinner';
import { cleanPayload } from '@/lib/clean-payload';
import { extractApiError } from '@/lib/api-error';

const STATUS_OPTIONS = ['ALL', 'DRAFT', 'CONFIRMED', 'ASSIGNED', 'CHECKED_OUT', 'CANCELLED', 'NO_SHOW'];

const emptyForm = {
  customer_id: '',
  vehicle_category_id: '',
  pickup_datetime: '',
  return_datetime: '',
  branch_id: '',
  notes: '',
};

export default function ReservationsPage() {
  const router = useRouter();
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);

  // Lookup data
  const [categories, setCategories] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [lookupsLoaded, setLookupsLoaded] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { router.prefetch('/reservations'); }, [router]);

  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const res = await reservationService.listReservations(params);
      setReservations(Array.isArray(res) ? res : (res?.data || []));
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to load reservations'));
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchReservations(); }, [fetchReservations]);

  // Load categories and branches once on page mount
  useEffect(() => {
    const loadLookups = async () => {
      try {
        const cats = await vehicleCategoryService.listVehicleCategories();
        setCategories(Array.isArray(cats) ? cats : []);
      } catch (err) {
        toast.error('Failed to load vehicle categories');
      }
      try {
        const brs = await branchService.listBranches();
        setBranches(Array.isArray(brs) ? brs : (brs?.data || []));
      } catch { /* branches optional */ }
      setLookupsLoaded(true);
    };
    loadLookups();
  }, []);

  // Reset customer search when modal opens
  useEffect(() => {
    if (showCreateModal) {
      setCustomerSearch('');
      setCustomers([]);
      setSelectedCustomer(null);
    }
  }, [showCreateModal]);

  // Customer search
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

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (customerRef.current && !customerRef.current.contains(e.target as Node)) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectCustomer = (c: any) => {
    setSelectedCustomer(c);
    setForm((f) => ({ ...f, customer_id: c.id }));
    setCustomerSearch(c.full_name_en ?? c.full_name ?? c.name ?? '');
    setShowCustomerDropdown(false);
  };

  const handleCreate = async () => {
    if (!form.customer_id) { toast.error('Please select a customer'); return; }
    if (!form.vehicle_category_id) { toast.error('Please select a vehicle category'); return; }
    if (!form.pickup_datetime) { toast.error('Pickup datetime is required'); return; }
    if (!form.return_datetime) { toast.error('Return datetime is required'); return; }
    try {
      setSubmitting(true);
      await reservationService.createReservation(cleanPayload({ ...form }));
      toast.success('Reservation created');
      setShowCreateModal(false);
      setForm({ ...emptyForm });
      fetchReservations();
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to create reservation'));
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Ref #',
      render: (row: any) => (
        <span className="font-mono text-xs text-gray-700">
          {row.reservation_number ?? row.id?.slice(0, 8)}
        </span>
      ),
    },
    {
      header: 'Customer',
      render: (row: any) =>
        row.customer_name ?? row.customer?.full_name_en ?? row.customer?.full_name ?? '—',
    },
    {
      header: 'Vehicle Category',
      render: (row: any) =>
        row.category_name ?? row.vehicle_category?.category_name ?? '—',
    },
    {
      header: 'Pickup',
      render: (row: any) =>
        row.pickup_datetime ? new Date(row.pickup_datetime).toLocaleDateString() : '—',
    },
    {
      header: 'Return',
      render: (row: any) =>
        row.return_datetime ? new Date(row.return_datetime).toLocaleDateString() : '—',
    },
    {
      header: 'Status',
      render: (row: any) => <StatusBadge status={row.status} />,
    },
    {
      header: '',
      render: (row: any) => (
        <button
          onClick={(e) => { e.stopPropagation(); router.push(`/reservations/${row.id}`); }}
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
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <HiOutlineCalendarDays className="h-5 w-5 text-blue-600" />
          </div>
          <PageHeader title="Reservations" />
        </div>
        <button
          onClick={() => { setForm({ ...emptyForm }); setShowCreateModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <HiOutlinePlusCircle className="h-5 w-5" />
          New Reservation
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
                <option key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s.replace(/_/g, ' ')}</option>
              ))}
            </select>
            <HiOutlineChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <DataTable
          columns={columns}
          data={reservations}
          onRowClick={(row: any) => router.push(`/reservations/${row.id}`)}
          emptyMessage="No reservations found."
        />
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="New Reservation">
        <div className="space-y-4">

          {/* Customer search */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Customer <span className="text-red-500">*</span>
            </label>
            <div className="relative" ref={customerRef}>
              <div className="relative">
                <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); setSelectedCustomer(null); setForm((f) => ({ ...f, customer_id: '' })); }}
                  onFocus={() => setShowCustomerDropdown(true)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search by name or phone..."
                />
              </div>
              {showCustomerDropdown && customers.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {customers.map((c: any) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => selectCustomer(c)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 text-sm"
                    >
                      <HiOutlineUser className="h-4 w-4 text-gray-400 shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">{c.full_name_en ?? c.full_name ?? c.name}</p>
                        <p className="text-xs text-gray-500">{c.phone_number ?? c.email ?? ''}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedCustomer && (
              <p className="text-xs text-green-600 mt-1">Selected: {selectedCustomer.full_name_en ?? selectedCustomer.full_name}</p>
            )}
          </div>

          {/* Vehicle Category */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Vehicle Category <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={form.vehicle_category_id}
                onChange={(e) => setForm({ ...form, vehicle_category_id: e.target.value })}
                className="appearance-none w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">-- Select category --</option>
                {categories.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.category_name}</option>
                ))}
              </select>
              <HiOutlineChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Pickup Date &amp; Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={form.pickup_datetime}
                onChange={(e) => setForm({ ...form, pickup_datetime: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Return Date &amp; Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={form.return_datetime}
                onChange={(e) => setForm({ ...form, return_datetime: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Branch */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Branch (optional)</label>
            <div className="relative">
              <select
                value={form.branch_id}
                onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
                className="appearance-none w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">-- No specific branch --</option>
                {branches.map((b: any) => (
                  <option key={b.id} value={b.id}>{b.branch_name}</option>
                ))}
              </select>
              <HiOutlineChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder="Any special requests..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {submitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {submitting ? 'Creating...' : 'Create Reservation'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
