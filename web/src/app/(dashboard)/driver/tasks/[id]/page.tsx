'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowLeft,
  HiOutlineMapPin,
  HiOutlinePhone,
  HiOutlineTruck,
  HiOutlineUser,
  HiOutlineClock,
  HiOutlineCamera,
  HiOutlineExclamationTriangle,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlinePlayCircle,
} from 'react-icons/hi2';
import { driverTaskService } from '@/services/driver-task.service';
import { extractApiError } from '@/lib/api-error';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { Spinner } from '@/components/Spinner';
import { Modal } from '@/components/Modal';

export default function TaskDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Complete modal state
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completeForm, setCompleteForm] = useState({
    odometer_reading: '',
    fuel_level: '',
    condition_notes: '',
    customer_confirmation_type: 'signature',
  });

  // Cancel modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Recovery attempt form
  const [showRecoveryForm, setShowRecoveryForm] = useState(false);
  const [recoveryForm, setRecoveryForm] = useState({
    notes: '',
    outcome: 'unsuccessful',
    location_lat: '',
    location_lng: '',
  });

  const [submitting, setSubmitting] = useState(false);

  const fetchTask = useCallback(async () => {
    try {
      setLoading(true);
      const res = await driverTaskService.getDriverTaskById(id as string);
      setTask(res.data ?? res);
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to load task'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  const handleStartTask = async () => {
    try {
      setSubmitting(true);
      await driverTaskService.startTask(id as string);
      toast.success('Task started');
      fetchTask();
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to start task'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteTask = async () => {
    try {
      setSubmitting(true);
      await driverTaskService.completeTask(id as string, {
        odometer_reading: Number(completeForm.odometer_reading),
        fuel_level: completeForm.fuel_level,
        condition_notes: completeForm.condition_notes,
        customer_confirmation_type: completeForm.customer_confirmation_type,
      });
      toast.success('Task completed');
      setShowCompleteModal(false);
      fetchTask();
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to complete task'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelTask = async () => {
    try {
      setSubmitting(true);
      await driverTaskService.cancelTask(id as string, cancelReason);
      toast.success('Task cancelled');
      setShowCancelModal(false);
      fetchTask();
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to cancel task'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddRecoveryAttempt = async () => {
    try {
      setSubmitting(true);
      await driverTaskService.addRecoveryAttempt(id as string, {
        ...recoveryForm,
        location_lat: recoveryForm.location_lat ? Number(recoveryForm.location_lat) : undefined,
        location_lng: recoveryForm.location_lng ? Number(recoveryForm.location_lng) : undefined,
      });
      toast.success('Recovery attempt added');
      setShowRecoveryForm(false);
      setRecoveryForm({ notes: '', outcome: 'unsuccessful', location_lat: '', location_lng: '' });
      fetchTask();
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to add recovery attempt'));
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

  if (!task) {
    return (
      <div className="text-center py-20 text-gray-500">
        Task not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/driver')} className="text-gray-500 hover:text-gray-700">
          <HiOutlineArrowLeft className="h-5 w-5" />
        </button>
        <PageHeader title={`Task #${task.id}`} />
      </div>

      {/* Task Info Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Task Information</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500">Type</p>
            <span className="inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {task.type}
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-500">Status</p>
            <div className="mt-1">
              <StatusBadge status={task.status} />
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500">Priority</p>
            <p className="text-sm font-medium text-gray-900 mt-1">{task.priority ?? 'NORMAL'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Scheduled Time</p>
            <p className="text-sm text-gray-900 mt-1">
              {task.scheduled_time ? new Date(task.scheduled_time).toLocaleString() : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Vehicle Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <HiOutlineTruck className="h-5 w-5" /> Vehicle
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500">Plate Number</p>
            <p className="text-sm font-medium text-gray-900">
              {task.vehicle?.plate_number ?? task.vehicle_plate ?? 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Make / Model</p>
            <p className="text-sm text-gray-900">
              {task.vehicle?.make ?? ''} {task.vehicle?.model ?? ''}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Color</p>
            <p className="text-sm text-gray-900">{task.vehicle?.color ?? 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Customer Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <HiOutlineUser className="h-5 w-5" /> Customer
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">Name</p>
            <p className="text-sm font-medium text-gray-900">
              {task.customer?.name ?? task.customer_name ?? 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Phone</p>
            <p className="text-sm text-gray-900 flex items-center gap-1">
              <HiOutlinePhone className="h-4 w-4" />
              {task.customer?.phone_number ?? task.customer_phone ?? 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Destination */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <HiOutlineMapPin className="h-5 w-5" /> Destination
        </h2>
        <p className="text-sm text-gray-700">
          {task.destination ?? task.destination_address ?? 'No address specified'}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow p-6 flex flex-wrap gap-3">
        {task.status === 'ASSIGNED' && (
          <button
            onClick={handleStartTask}
            disabled={submitting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <HiOutlinePlayCircle className="h-5 w-5" />
            {submitting ? 'Starting...' : 'Start Task'}
          </button>
        )}
        {task.status === 'IN_PROGRESS' && (
          <>
            <button
              onClick={() => setShowCompleteModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <HiOutlineCheckCircle className="h-5 w-5" />
              Complete Task
            </button>
            <button
              onClick={() => setShowCancelModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <HiOutlineXCircle className="h-5 w-5" />
              Cancel Task
            </button>
          </>
        )}
      </div>

      {/* Evidence Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <HiOutlineCamera className="h-5 w-5" /> Evidence
        </h2>
        {task.evidence_photos && task.evidence_photos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {task.evidence_photos.map((photo: string, idx: number) => (
              <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                <img src={photo} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No photos uploaded.</p>
        )}

        <h3 className="text-sm font-medium text-gray-700 mt-6 mb-2">Damages Recorded</h3>
        {task.damages && task.damages.length > 0 ? (
          <ul className="space-y-2">
            {task.damages.map((damage: any, idx: number) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                <HiOutlineExclamationTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <span>{damage.description ?? damage}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No damages recorded.</p>
        )}
      </div>

      {/* Location History */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <HiOutlineClock className="h-5 w-5" /> Location History
        </h2>
        {task.location_history && task.location_history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Latitude</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Longitude</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {task.location_history.map((loc: any, idx: number) => (
                  <tr key={idx}>
                    <td className="px-4 py-2 text-sm text-gray-700">{loc.lat ?? loc.latitude}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{loc.lng ?? loc.longitude}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">
                      {loc.timestamp ? new Date(loc.timestamp).toLocaleString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No location data available.</p>
        )}
      </div>

      {/* Recovery Attempts (only for RECOVERY tasks) */}
      {task.type === 'RECOVERY' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recovery Attempts</h2>
            <button
              onClick={() => setShowRecoveryForm(!showRecoveryForm)}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              {showRecoveryForm ? 'Cancel' : 'Add Attempt'}
            </button>
          </div>

          {showRecoveryForm && (
            <div className="border border-gray-200 rounded-lg p-4 mb-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={recoveryForm.notes}
                  onChange={(e) => setRecoveryForm({ ...recoveryForm, notes: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe the attempt..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Outcome</label>
                <select
                  value={recoveryForm.outcome}
                  onChange={(e) => setRecoveryForm({ ...recoveryForm, outcome: e.target.value })}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="unsuccessful">Unsuccessful</option>
                  <option value="successful">Successful</option>
                  <option value="partial">Partial</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                  <input
                    type="text"
                    value={recoveryForm.location_lat}
                    onChange={(e) => setRecoveryForm({ ...recoveryForm, location_lat: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="25.2048"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                  <input
                    type="text"
                    value={recoveryForm.location_lng}
                    onChange={(e) => setRecoveryForm({ ...recoveryForm, location_lng: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="55.2708"
                  />
                </div>
              </div>
              <button
                onClick={handleAddRecoveryAttempt}
                disabled={submitting || !recoveryForm.notes}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save Attempt'}
              </button>
            </div>
          )}

          {task.recovery_attempts && task.recovery_attempts.length > 0 ? (
            <ul className="space-y-3">
              {task.recovery_attempts.map((attempt: any, idx: number) => (
                <li key={idx} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">Attempt #{idx + 1}</span>
                    <StatusBadge status={attempt.outcome} />
                  </div>
                  <p className="text-sm text-gray-600">{attempt.notes}</p>
                  {attempt.location_lat && (
                    <p className="text-xs text-gray-400 mt-1">
                      Location: {attempt.location_lat}, {attempt.location_lng}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No recovery attempts yet.</p>
          )}
        </div>
      )}

      {/* Complete Task Modal */}
      <Modal
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        title="Complete Task"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Odometer Reading</label>
            <input
              type="number"
              value={completeForm.odometer_reading}
              onChange={(e) => setCompleteForm({ ...completeForm, odometer_reading: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter current odometer reading"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Level (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={completeForm.fuel_level}
              onChange={(e) => setCompleteForm({ ...completeForm, fuel_level: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. 75"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Condition Notes</label>
            <textarea
              value={completeForm.condition_notes}
              onChange={(e) => setCompleteForm({ ...completeForm, condition_notes: e.target.value })}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe the vehicle condition..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Confirmation</label>
            <select
              value={completeForm.customer_confirmation_type}
              onChange={(e) =>
                setCompleteForm({ ...completeForm, customer_confirmation_type: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="signature">Signature</option>
              <option value="otp">OTP</option>
              <option value="photo_id">Photo ID</option>
              <option value="none">None</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowCompleteModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCompleteTask}
              disabled={submitting}
              className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {submitting ? 'Completing...' : 'Complete Task'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Cancel Task Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Task"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Cancellation</label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Please provide a reason..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowCancelModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              Go Back
            </button>
            <button
              onClick={handleCancelTask}
              disabled={submitting || !cancelReason}
              className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
