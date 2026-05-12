'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiOutlineWrenchScrewdriver, HiOutlinePlusCircle, HiOutlineMagnifyingGlass,
  HiChevronRight,
} from 'react-icons/hi2';
import { accountsService } from '@/services/accounts.service';
import { extractApiError } from '@/lib/api-error';

const TABS = ['all', 'overdue', 'upcoming'] as const;
type Tab = typeof TABS[number];

const STATUS_OPTIONS = ['ALL', 'open', 'in_progress', 'completed', 'cancelled'];

const STATUS_BADGE: Record<string, string> = {
  open:        'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed:   'bg-emerald-100 text-emerald-700',
  cancelled:   'bg-red-100 text-red-700',
};

const TYPE_BADGE: Record<string, string> = {
  scheduled:   'bg-indigo-50 text-indigo-700',
  unscheduled: 'bg-orange-50 text-orange-700',
  recall:      'bg-red-50 text-red-700',
  inspection:  'bg-teal-50 text-teal-700',
};

export default function MaintenancePage() {
  const router = useRouter();
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState<Tab>('all');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch]         = useState('');

  const fetchWorkOrders = useCallback(async () => {
    setLoading(true);
    try {
      let items: any[] = [];
      if (activeTab === 'overdue') {
        const res = await accountsService.getOverdueMaintenance();
        items = Array.isArray(res) ? res : (res?.data ?? []);
      } else if (activeTab === 'upcoming') {
        const res = await accountsService.getUpcomingMaintenance();
        items = Array.isArray(res) ? res : (res?.data ?? []);
      } else {
        const params: Record<string, string> = {};
        if (statusFilter !== 'ALL') params.status = statusFilter;
        const res = await accountsService.getMaintenanceRecords(params);
        items = Array.isArray(res) ? res : (res?.data ?? []);
      }
      setWorkOrders(items);
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to load work orders'));
    } finally { setLoading(false); }
  }, [activeTab, statusFilter]);

  useEffect(() => { fetchWorkOrders(); }, [fetchWorkOrders]);

  const filtered = workOrders.filter(w => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (w.work_order_number ?? '').toLowerCase().includes(q) ||
      (w.vehicle?.plate_number ?? '').toLowerCase().includes(q) ||
      (w.vehicle?.make ?? '').toLowerCase().includes(q) ||
      (w.vehicle?.model ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
            <HiOutlineWrenchScrewdriver className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Maintenance</h1>
            <p className="text-sm text-gray-500">{workOrders.length} work order{workOrders.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button onClick={() => router.push('/maintenance/create')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 shadow-sm transition-all">
          <HiOutlinePlusCircle className="w-5 h-5" /> Create Work Order
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by WO#, plate, make..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all" />
        </div>

        {/* Tab pills */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {TABS.map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                activeTab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}>{t}</button>
          ))}
        </div>

        {/* Status filter — only for 'all' tab */}
        {activeTab === 'all' && (
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            {STATUS_OPTIONS.map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === s ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}>
                {s === 'ALL' ? 'All' : s.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mb-4">
              <HiOutlineWrenchScrewdriver className="w-7 h-7 text-orange-400" />
            </div>
            <p className="text-gray-500 font-medium">No work orders found</p>
            <p className="text-gray-400 text-sm mt-1">
              {search || statusFilter !== 'ALL' ? 'Try adjusting your filters' : 'Create your first work order'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/60 border-b border-gray-100">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Work Order</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Vehicle</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Scheduled</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Est. Cost</th>
                <th className="px-3 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((w, idx) => {
                const statusCls = STATUS_BADGE[w.status] ?? 'bg-gray-100 text-gray-600';
                const typeCls   = TYPE_BADGE[w.type]   ?? 'bg-gray-100 text-gray-600';
                return (
                  <tr key={w.id}
                    onClick={() => router.push(`/maintenance/${w.id}`)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors group">
                    <td className="px-5 py-4 text-gray-400 text-xs">{idx + 1}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                          <HiOutlineWrenchScrewdriver className="w-4 h-4 text-orange-500" />
                        </div>
                        <span className="font-mono text-xs font-semibold text-gray-900">
                          {w.work_order_number ?? w.id?.slice(0, 8)}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {w.vehicle ? (
                        <div>
                          <p className="font-medium text-gray-900">{w.vehicle.make} {w.vehicle.model}</p>
                          <p className="font-mono text-xs text-gray-400">{w.vehicle.plate_number}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${typeCls}`}>
                        {(w.type ?? '').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${statusCls}`}>
                        {(w.status ?? '').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs">
                      {w.scheduled_date ? new Date(w.scheduled_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      {w.estimated_cost ? `AED ${Number(w.estimated_cost).toLocaleString()}` : '—'}
                    </td>
                    <td className="px-3 py-4">
                      <HiChevronRight className="w-4 h-4 text-gray-300 group-hover:text-orange-400 transition-colors" />
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
