'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowLeft,
  HiOutlineWrenchScrewdriver,
  HiOutlinePlayCircle,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
} from 'react-icons/hi2';
import { accountsService } from '@/services/accounts.service';
import { extractApiError } from '@/lib/api-error';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { Spinner } from '@/components/Spinner';
import { Modal } from '@/components/Modal';

export default function WorkOrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [workOrder, setWorkOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Complete modal
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [actualCost, setActualCost] = useState('');

  // Cancel confirmation
  const [showCancelModal, setShowCancelModal] = useState(false);

  const fetchWorkOrder = useCallback(async () => {
    try {
      setLoading(true);
      const res = await accountsService.getMaintenanceById(id as string);
      setWorkOrder(res.data ?? res);
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to load work order'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchWorkOrder();
  }, [fetchWorkOrder]);

  const handleStart = async () => {
    try {
      setSubmitting(true);
      await accountsService.startMaintenance(id as string);
      toast.success('Work order started');
      fetchWorkOrder();
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to start work order'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async () => {
    try {
      setSubmitting(true);
      await accountsService.completeMaintenance(id as string, actualCost ? Number(actualCost) : 0);
      toast.success('Work order completed');
      setShowCompleteModal(false);
      fetchWorkOrder();
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to complete work order'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    try {
      setSubmitting(true);
      await accountsService.cancelMaintenance(id as string);
      toast.success('Work order cancelled');
      setShowCancelModal(false);
      fetchWorkOrder();
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to cancel work order'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div className="text-center py-20 text-gray-500">Work order not found.</div>
    );
  }

  const isViewOnly = workOrder.status === 'completed' || workOrder.status === 'cancelled';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/maintenance')} className="text-gray-500 hover:text-gray-700">
          <HiOutlineArrowLeft className="h-5 w-5" />
        </button>
        <PageHeader title={`Work Order #${workOrder.work_order_number ?? workOrder.id}`} />
      </div>

      {/* WO Info Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <HiOutlineWrenchScrewdriver className="h-5 w-5" /> Work Order Details
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500">WO Number</p>
            <p className="text-sm font-medium text-gray-900">
              {workOrder.work_order_number ?? workOrder.id}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Type</p>
            <p className="text-sm font-medium text-gray-900 capitalize">
              {(workOrder.type ?? '').replace(/_/g, ' ')}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Status</p>
            <div className="mt-1">
              <StatusBadge status={workOrder.status} />
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500">Vehicle</p>
            <p className="text-sm font-medium text-gray-900">
              {workOrder.vehicle?.plate_number ?? workOrder.vehicle_plate ?? workOrder.vehicle_id ?? 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Scheduled Date</p>
            <p className="text-sm text-gray-900">
              {workOrder.scheduled_date
                ? new Date(workOrder.scheduled_date).toLocaleDateString()
                : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Started At</p>
            <p className="text-sm text-gray-900">
              {workOrder.started_at
                ? new Date(workOrder.started_at).toLocaleString()
                : 'Not started'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Completed At</p>
            <p className="text-sm text-gray-900">
              {workOrder.completed_at
                ? new Date(workOrder.completed_at).toLocaleString()
                : 'Not completed'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Estimated Cost</p>
            <p className="text-sm text-gray-900">
              {workOrder.estimated_cost
                ? `AED ${Number(workOrder.estimated_cost).toLocaleString()}`
                : '-'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Actual Cost</p>
            <p className="text-sm text-gray-900">
              {workOrder.actual_cost
                ? `AED ${Number(workOrder.actual_cost).toLocaleString()}`
                : '-'}
            </p>
          </div>
        </div>

        {workOrder.description && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Description</p>
            <p className="text-sm text-gray-700">{workOrder.description}</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {!isViewOnly && (
        <div className="bg-white rounded-lg shadow p-6 flex flex-wrap gap-3">
          {workOrder.status === 'open' && (
            <button
              onClick={handleStart}
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <HiOutlinePlayCircle className="h-5 w-5" />
              {submitting ? 'Starting...' : 'Start Work'}
            </button>
          )}
          {workOrder.status === 'in_progress' && (
            <button
              onClick={() => setShowCompleteModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <HiOutlineCheckCircle className="h-5 w-5" />
              Complete
            </button>
          )}
          <button
            onClick={() => setShowCancelModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <HiOutlineXCircle className="h-5 w-5" />
            Cancel Work Order
          </button>
        </div>
      )}

      {/* Vehicle Maintenance Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Maintenance Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="border border-gray-200 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500">Vehicle</p>
            <p className="text-sm font-medium text-gray-900 mt-1">
              {workOrder.vehicle?.plate_number ?? workOrder.vehicle_id ?? 'N/A'}
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500">Make / Model</p>
            <p className="text-sm font-medium text-gray-900 mt-1">
              {workOrder.vehicle?.make ?? ''} {workOrder.vehicle?.model ?? ''}
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500">Total WOs</p>
            <p className="text-sm font-medium text-gray-900 mt-1">
              {workOrder.vehicle_maintenance_count ?? '-'}
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500">Last Service</p>
            <p className="text-sm font-medium text-gray-900 mt-1">
              {workOrder.vehicle_last_service
                ? new Date(workOrder.vehicle_last_service).toLocaleDateString()
                : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Complete Modal */}
      <Modal
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        title="Complete Work Order"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Actual Cost (AED)</label>
            <input
              type="number"
              value={actualCost}
              onChange={(e) => setActualCost(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter actual cost"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowCompleteModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleComplete}
              disabled={submitting}
              className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {submitting ? 'Completing...' : 'Complete'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Cancel Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Work Order"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to cancel this work order? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowCancelModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              Go Back
            </button>
            <button
              onClick={handleCancel}
              disabled={submitting}
              className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? 'Cancelling...' : 'Confirm Cancel'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
