'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiPlus, HiMagnifyingGlass, HiChevronRight, HiOutlineClock,
  HiOutlineClipboardDocumentList, HiXMark, HiPencilSquare,
} from 'react-icons/hi2';
import { workOrderService } from '@/services/work-order.service';
import { extractApiError } from '@/lib/api-error';

const STATUS_OPTIONS = ['ALL', 'open', 'in_progress', 'completed', 'cancelled'];

const STATUS_BADGE: Record<string, string> = {
  open:        'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  completed:   'bg-emerald-100 text-emerald-700',
  cancelled:   'bg-gray-100 text-gray-500',
};

// ── Detail Drawer ─────────────────────────────────────────────────────────────
function WorkOrderDrawer({ open, onClose, order, onSaved }: {
  open: boolean; onClose: () => void; order: any | null; onSaved: () => void;
}) {
  const [updating, setUpdating] = useState(false);

  const handleStatusChange = async (status: string) => {
    if (!order) return;
    setUpdating(true);
    try {
      await workOrderService.updateWorkOrder(order.id, { status });
      toast.success('Status updated');
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to update'));
    } finally { setUpdating(false); }
  };

  if (!order) return null;

  const badgeClass = STATUS_BADGE[order.status] || 'bg-gray-100 text-gray-500';

  return (
    <>
      <div onClick={onClose}
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />

      <div className={`fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <HiOutlineClipboardDocumentList className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Work Order</h2>
              <p className="text-xs text-gray-500 font-mono">{order.work_order_number ?? order.id?.slice(0, 8)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-200 transition-colors">
            <HiXMark className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">Work Order Info</p>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${badgeClass}`}>{order.status?.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Type</span>
                <span className="text-sm font-semibold text-gray-900 capitalize">{order.type?.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Vehicle</span>
                <span className="text-sm font-semibold text-gray-900 font-mono">{order.plate_number ?? order.vehicle?.plate_number ?? '—'}</span>
              </div>
              {order.scheduled_date && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Scheduled</span>
                  <span className="text-sm font-semibold text-gray-900">{new Date(order.scheduled_date).toLocaleDateString()}</span>
                </div>
              )}
              {order.estimated_cost != null && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Est. Cost</span>
                  <span className="text-sm font-semibold text-gray-900">AED {Number(order.estimated_cost).toLocaleString()}</span>
                </div>
              )}
              {order.actual_cost != null && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Actual Cost</span>
                  <span className="text-sm font-semibold text-gray-900">AED {Number(order.actual_cost).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {order.description && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">Description</p>
              <p className="text-sm text-gray-700 leading-relaxed">{order.description}</p>
            </div>
          )}

          {order.status !== 'completed' && order.status !== 'cancelled' && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">Update Status</p>
              <div className="grid grid-cols-2 gap-2">
                {order.status === 'open' && (
                  <button onClick={() => handleStatusChange('in_progress')} disabled={updating}
                    className="py-2.5 px-3 rounded-xl border-2 border-amber-300 bg-amber-50 text-amber-700 text-sm font-semibold hover:bg-amber-100 transition-colors disabled:opacity-50">
                    Mark In Progress
                  </button>
                )}
                <button onClick={() => handleStatusChange('completed')} disabled={updating}
                  className="py-2.5 px-3 rounded-xl border-2 border-emerald-300 bg-emerald-50 text-emerald-700 text-sm font-semibold hover:bg-emerald-100 transition-colors disabled:opacity-50">
                  Mark Completed
                </button>
                <button onClick={() => handleStatusChange('cancelled')} disabled={updating}
                  className="py-2.5 px-3 rounded-xl border-2 border-gray-200 bg-white text-gray-500 text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button onClick={onClose}
            className="w-full py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            Close
          </button>
        </div>
      </div>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function WorkOrdersPage() {
  const router = useRouter();
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState<'all' | 'due_soon'>('all');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch]         = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected]     = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'due_soon') {
        const res = await workOrderService.getDueSoonWorkOrders();
        setWorkOrders(Array.isArray(res) ? res : (res?.data || []));
        return;
      }
      const params: Record<string, string> = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const res = await workOrderService.listWorkOrders(params);
      setWorkOrders(Array.isArray(res) ? res : (res?.data || []));
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to load work orders'));
    } finally { setLoading(false); }
  }, [activeTab, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = workOrders.filter(w =>
    !search ||
    (w.work_order_number ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (w.plate_number ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (w.description ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Work Orders</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {workOrders.length > 0 ? `${workOrders.length} work order${workOrders.length !== 1 ? 's' : ''}` : 'Vehicle maintenance & repairs'}
          </p>
        </div>
        <button onClick={() => router.push('/work-orders/create')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 shadow-sm transition-colors">
          <HiPlus className="w-5 h-5" /> Create Work Order
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {[
          { key: 'all', label: 'All Work Orders' },
          { key: 'due_soon', label: 'Due Soon', icon: <HiOutlineClock className="w-4 h-4" /> },
        ].map(({ key, label, icon }) => (
          <button key={key} onClick={() => setActiveTab(key as any)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {icon}{label}
          </button>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search work orders..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 bg-white" />
        </div>
        {activeTab === 'all' && (
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 min-w-[160px] capitalize">
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s.replace(/_/g, ' ')}</option>)}
          </select>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <HiOutlineClipboardDocumentList className="w-7 h-7 text-gray-400" />
            </div>
            <p className="font-semibold text-gray-700">No work orders found</p>
            <p className="text-sm text-gray-400 mt-1">Create a work order to get started</p>
            <button onClick={() => router.push('/work-orders/create')}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700">
              <HiPlus className="w-4 h-4" /> Create Work Order
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">WO #</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vehicle</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Scheduled</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Est. Cost</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((w, i) => {
                const badgeClass = STATUS_BADGE[w.status] || 'bg-gray-100 text-gray-500';
                return (
                  <tr key={w.id} onClick={() => { setSelected(w); setDrawerOpen(true); }}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors group">
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs text-gray-700">{w.work_order_number ?? w.id?.slice(0, 8)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-semibold text-gray-900 font-mono">{w.plate_number ?? w.vehicle?.plate_number ?? '—'}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-gray-700 capitalize">{(w.type ?? '').replace(/_/g, ' ')}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${badgeClass}`}>
                        {w.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {w.scheduled_date ? new Date(w.scheduled_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700">
                      {w.estimated_cost != null ? `AED ${Number(w.estimated_cost).toLocaleString()}` : '—'}
                    </td>
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

      <WorkOrderDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        order={selected}
        onSaved={load}
      />
    </div>
  );
}
