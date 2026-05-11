'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiOutlineClipboardDocumentList,
  HiOutlinePlusCircle,
  HiOutlineFunnel,
  HiOutlineChevronDown,
  HiOutlineClock,
} from 'react-icons/hi2';
import { workOrderService } from '@/services/work-order.service';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { Modal } from '@/components/Modal';
import { Spinner } from '@/components/Spinner';
import { cleanPayload } from '@/lib/clean-payload';
import { extractApiError } from '@/lib/api-error';

const STATUS_OPTIONS = ['ALL', 'DRAFT', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const TYPE_OPTIONS = ['repair', 'service', 'inspection', 'bodywork', 'tires', 'electrical', 'other'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent'];

const emptyForm = {
  vehicle_id: '',
  type: 'service',
  description: '',
  priority: 'medium',
  estimated_cost: '',
  scheduled_date: '',
};

export default function WorkOrdersPage() {
  const router = useRouter();
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'due_soon'>('all');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);

  const fetchWorkOrders = useCallback(async () => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  }, [activeTab, statusFilter]);

  useEffect(() => { fetchWorkOrders(); }, [fetchWorkOrders]);

  const handleCreate = async () => {
    if (!form.vehicle_id.trim() || !form.description.trim()) {
      toast.error('Vehicle ID and description are required');
      return;
    }
    try {
      setSubmitting(true);
      const payload: Record<string, any> = { ...form };
      if (payload.estimated_cost) payload.estimated_cost = Number(payload.estimated_cost);
      else delete payload.estimated_cost;
      await workOrderService.createWorkOrder(cleanPayload(payload));
      toast.success('Work order created');
      setShowCreateModal(false);
      setForm({ ...emptyForm });
      fetchWorkOrders();
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to create work order'));
    } finally {
      setSubmitting(false);
    }
  };

  const priorityColor: Record<string, string> = {
    low: 'bg-gray-100 text-gray-600',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
  };

  const columns = [
    {
      header: 'WO #',
      render: (row: any) => (
        <span className="font-mono text-xs text-gray-700">{row.work_order_number ?? row.id?.slice(0, 8)}</span>
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
      header: 'Priority',
      render: (row: any) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${priorityColor[row.priority] ?? 'bg-gray-100 text-gray-600'}`}>
          {row.priority ?? '—'}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (row: any) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Scheduled',
      render: (row: any) =>
        row.scheduled_date ? new Date(row.scheduled_date).toLocaleDateString() : '—',
    },
    {
      header: 'Est. Cost',
      render: (row: any) =>
        row.estimated_cost != null ? `AED ${Number(row.estimated_cost).toLocaleString()}` : '—',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
            <HiOutlineClipboardDocumentList className="h-5 w-5 text-teal-600" />
          </div>
          <PageHeader title="Work Orders" />
        </div>
        <button
          onClick={() => { setForm({ ...emptyForm }); setShowCreateModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <HiOutlinePlusCircle className="h-5 w-5" />
          Create Work Order
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { key: 'all', label: 'All Work Orders' },
          { key: 'due_soon', label: 'Due Soon', icon: <HiOutlineClock className="h-4 w-4" /> },
        ].map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* Filters (only for all tab) */}
      {activeTab === 'all' && (
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
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <DataTable
          columns={columns}
          data={workOrders}
          emptyMessage="No work orders found."
        />
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Work Order">
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Type</label>
              <div className="relative">
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="appearance-none w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white capitalize"
                >
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                  ))}
                </select>
                <HiOutlineChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Priority</label>
              <div className="relative">
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="appearance-none w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white capitalize"
                >
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <HiOutlineChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
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
              placeholder="Describe the work to be done..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Est. Cost (AED)</label>
              <input
                type="number"
                value={form.estimated_cost}
                onChange={(e) => setForm({ ...form, estimated_cost: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Scheduled Date</label>
              <input
                type="date"
                value={form.scheduled_date}
                onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
            <button
              onClick={handleCreate}
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {submitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {submitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
