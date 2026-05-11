'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiOutlineCalendarDays,
  HiOutlinePlusCircle,
  HiOutlineFunnel,
  HiOutlineChevronDown,
} from 'react-icons/hi2';
import { reservationService } from '@/services/reservation.service';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { Modal } from '@/components/Modal';
import { Spinner } from '@/components/Spinner';
import { cleanPayload } from '@/lib/clean-payload';
import { extractApiError } from '@/lib/api-error';

const STATUS_OPTIONS = ['ALL', 'PENDING', 'CONFIRMED', 'VEHICLE_ASSIGNED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];

const emptyForm = {
  customer_id: '',
  vehicle_category_id: '',
  pickup_date: '',
  return_date: '',
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

  const handleCreate = async () => {
    if (!form.customer_id || !form.vehicle_category_id || !form.pickup_date || !form.return_date) {
      toast.error('Customer, category, pickup date and return date are required');
      return;
    }
    try {
      setSubmitting(true);
      const payload = cleanPayload({ ...form });
      await reservationService.createReservation(payload);
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
        row.customer?.full_name ?? row.customer?.name ?? row.customer_id?.slice(0, 8) ?? 'N/A',
    },
    {
      header: 'Vehicle Category',
      render: (row: any) =>
        row.vehicle_category?.name ?? row.vehicle_category_id?.slice(0, 8) ?? 'N/A',
    },
    {
      header: 'Pickup',
      render: (row: any) =>
        row.pickup_date ? new Date(row.pickup_date).toLocaleDateString() : 'N/A',
    },
    {
      header: 'Return',
      render: (row: any) =>
        row.return_date ? new Date(row.return_date).toLocaleDateString() : 'N/A',
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
        <PageHeader title="Reservations" />
        <button
          onClick={() => setShowCreateModal(true)}
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
          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Vehicle Category ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.vehicle_category_id}
                onChange={(e) => setForm({ ...form, vehicle_category_id: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Category UUID"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Pickup Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.pickup_date}
                onChange={(e) => setForm({ ...form, pickup_date: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Return Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.return_date}
                onChange={(e) => setForm({ ...form, return_date: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Branch ID (optional)</label>
            <input
              type="text"
              value={form.branch_id}
              onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Branch UUID"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder="Any special requests or notes..."
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
