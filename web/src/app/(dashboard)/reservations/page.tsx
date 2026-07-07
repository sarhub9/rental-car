'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiOutlineCalendarDays, HiOutlinePlusCircle, HiOutlineMagnifyingGlass,
  HiChevronRight,
} from 'react-icons/hi2';
import { reservationService } from '@/services/reservation.service';
import { extractApiError } from '@/lib/api-error';

const STATUS_OPTIONS = ['ALL', 'DRAFT', 'CONFIRMED', 'ASSIGNED', 'CHECKED_OUT', 'CANCELLED', 'NO_SHOW'];

const STATUS_BADGE: Record<string, string> = {
  DRAFT:       'bg-gray-100 text-gray-600',
  CONFIRMED:   'bg-blue-100 text-blue-700',
  ASSIGNED:    'bg-indigo-100 text-indigo-700',
  CHECKED_OUT: 'bg-emerald-100 text-emerald-700',
  CANCELLED:   'bg-red-100 text-red-700',
  NO_SHOW:     'bg-yellow-100 text-yellow-700',
};

export default function ReservationsPage() {
  const router = useRouter();
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch]             = useState('');

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const res = await reservationService.listReservations(params);
      setReservations(Array.isArray(res) ? res : (res?.data ?? []));
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to load reservations'));
    } finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetchReservations(); }, [fetchReservations]);

  const filtered = reservations.filter(r => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (r.reservation_number ?? '').toLowerCase().includes(q) ||
      (r.customer?.full_name_en ?? r.customer_name ?? '').toLowerCase().includes(q) ||
      (r.customer?.phone_number ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <HiOutlineCalendarDays className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Reservations</h1>
            <p className="text-sm text-gray-500">{reservations.length} reservation{reservations.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button onClick={() => router.push('/reservations/create')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 shadow-sm transition-all">
          <HiOutlinePlusCircle className="w-5 h-5" /> New Reservation
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, phone, reservation #..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all" />
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 flex-wrap">
          {STATUS_OPTIONS.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === s ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {s === 'ALL' ? 'All' : s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
              <HiOutlineCalendarDays className="w-7 h-7 text-blue-400" />
            </div>
            <p className="text-gray-500 font-medium">No reservations found</p>
            <p className="text-gray-400 text-sm mt-1">
              {search || statusFilter !== 'ALL' ? 'Try adjusting your filters' : 'Create your first reservation'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="bg-gray-50/60 border-b border-gray-100">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Reservation</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Pickup</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Return</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-3 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((r, idx) => {
                const badge = STATUS_BADGE[r.status] ?? 'bg-gray-100 text-gray-600';
                return (
                  <tr key={r.id}
                    onClick={() => router.push(`/reservations/${r.id}`)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors group">
                    <td className="px-5 py-4 text-gray-400 text-xs">{idx + 1}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                          <HiOutlineCalendarDays className="w-4 h-4 text-blue-500" />
                        </div>
                        <span className="font-mono text-xs font-semibold text-gray-900">
                          {r.reservation_number ?? r.id?.slice(0, 8)}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">
                        {r.customer?.full_name_en ?? r.customer_name ?? '—'}
                      </p>
                      {r.customer?.phone_number && (
                        <p className="text-xs text-gray-400">{r.customer.phone_number}</p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {r.vehicle_category?.category_name ?? r.category_name ?? '—'}
                    </td>
                    <td className="px-5 py-4 text-gray-600 text-xs">
                      {r.pickup_datetime ? new Date(r.pickup_datetime).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-5 py-4 text-gray-600 text-xs">
                      {r.return_datetime ? new Date(r.return_datetime).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge}`}>
                        {(r.status ?? '').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      <HiChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
