'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiOutlineWrenchScrewdriver,
  HiOutlinePlusCircle,
  HiOutlineFunnel,
} from 'react-icons/hi2';
import { accountsService } from '@/services/accounts.service';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { Modal } from '@/components/Modal';
import { Spinner } from '@/components/Spinner';
import { cleanPayload, sanitizeUuidFields } from '@/lib/clean-payload';

export default function MaintenancePage() {
  const router = useRouter();
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'overdue' | 'upcoming'>('all');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [vehicleFilter, setVehicleFilter] = useState('');

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    vehicle_id: '',
    type: 'scheduled',
    description: '',
    estimated_cost: '',
    scheduled_date: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchWorkOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (activeTab !== 'all') params.filter = activeTab;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (vehicleFilter) params.vehicle_id = vehicleFilter;

      const res = await accountsService.getMaintenanceRecords(params);

      // Handle response - API returns array directly after our service fix
      if (Array.isArray(res)) {
        setWorkOrders(res);
      } else if (res.data) {
        setWorkOrders(res.data);
      } else {
        setWorkOrders(res);
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to load work orders');
    } finally {
      setLoading(false);
    }
  }, [activeTab, statusFilter, vehicleFilter]);

  useEffect(() => {
    fetchWorkOrders();
  }, [fetchWorkOrders]);

  const handleCreate = async () => {
    try {
      setSubmitting(true);
      let payload: Record<string, unknown> = {
        vehicle_id: createForm.vehicle_id,
        type: createForm.type,
        description: createForm.description,
        estimated_cost: createForm.estimated_cost ? Number(createForm.estimated_cost) : undefined,
        scheduled_date: createForm.scheduled_date || undefined,
      };
      const cleaned = cleanPayload(payload) as Record<string, unknown>;
      sanitizeUuidFields(cleaned, ['vehicle_id']);
      await accountsService.createMaintenance(cleaned as any);
      toast.success('Work order created');
      setShowCreateModal(false);
      setCreateForm({
        vehicle_id: '',
        type: 'scheduled',
        description: '',
        estimated_cost: '',
        scheduled_date: '',
      });
      fetchWorkOrders();
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to create work order');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'WO #',
      render: (row: any) => row.work_order_number ?? row.id ?? 'N/A',
    },
    {
      header: 'Vehicle',
      render: (row: any) =>
        row.vehicle?.plate_number ?? row.vehicle_plate ?? row.vehicle_id ?? 'N/A',
    },
    {
      header: 'Type',
      render: (row: any) => (
        <span className="capitalize text-sm">{(row.type ?? '').replace(/_/g, ' ')}</span>
      ),
    },
    {
      header: 'Status',
      render: (row: any) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Scheduled Date',
      render: (row: any) =>
        row.scheduled_date ? new Date(row.scheduled_date).toLocaleDateString() : 'N/A',
    },
    {
      header: 'Est. Cost',
      render: (row: any) =>
        row.estimated_cost ? `AED ${Number(row.estimated_cost).toLocaleString()}` : '-',
    },
    {
      header: 'Actions',
      render: (row: any) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/maintenance/${row.id}`);
          }}
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
        <PageHeader title="Maintenance / Work Orders" />
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          <HiOutlinePlusCircle className="h-5 w-5" />
          Create Work Order
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {(['all', 'overdue', 'upcoming'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-wrap items-center gap-4">
        <HiOutlineFunnel className="h-5 w-5 text-gray-400" />
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Vehicle ID</label>
          <input
            type="text"
            value={vehicleFilter}
            onChange={(e) => setVehicleFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Filter by vehicle"
          />
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={workOrders}
          onRowClick={(row: any) => router.push(`/maintenance/${row.id}`)}
          emptyMessage="No work orders found."
        />
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Work Order"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle ID</label>
            <input
              type="text"
              value={createForm.vehicle_id}
              onChange={(e) => setCreateForm({ ...createForm, vehicle_id: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter vehicle ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={createForm.type}
              onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="scheduled">Scheduled</option>
              <option value="unscheduled">Unscheduled</option>
              <option value="recall">Recall</option>
              <option value="inspection">Inspection</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe the maintenance work..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Cost</label>
              <input
                type="number"
                value={createForm.estimated_cost}
                onChange={(e) => setCreateForm({ ...createForm, estimated_cost: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="AED"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
              <input
                type="date"
                value={createForm.scheduled_date}
                onChange={(e) => setCreateForm({ ...createForm, scheduled_date: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
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
              disabled={submitting || !createForm.vehicle_id || !createForm.description}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Work Order'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
