'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowLeft,
  HiOutlineCalendarDays,
  HiOutlineCheckCircle,
  HiOutlineTruck,
  HiOutlineXCircle,
  HiOutlineUserMinus,
} from 'react-icons/hi2';
import { reservationService } from '@/services/reservation.service';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { Modal } from '@/components/Modal';
import { Spinner } from '@/components/Spinner';
import { extractApiError } from '@/lib/api-error';

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-900 mt-0.5">{value ?? '—'}</p>
    </div>
  );
}

export default function ReservationDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [reservation, setReservation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [vehicleId, setVehicleId] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const fetchReservation = useCallback(async () => {
    try {
      setLoading(true);
      const res = await reservationService.getReservationById(id as string);
      setReservation(res);
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to load reservation'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchReservation(); }, [fetchReservation]);

  const handleConfirm = async () => {
    try {
      setSubmitting(true);
      await reservationService.confirmReservation(id as string);
      toast.success('Reservation confirmed');
      fetchReservation();
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to confirm reservation'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignVehicle = async () => {
    if (!vehicleId.trim()) { toast.error('Vehicle ID is required'); return; }
    try {
      setSubmitting(true);
      await reservationService.assignVehicle(id as string, vehicleId.trim());
      toast.success('Vehicle assigned');
      setShowAssignModal(false);
      setVehicleId('');
      fetchReservation();
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to assign vehicle'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    try {
      setSubmitting(true);
      await reservationService.cancelReservation(id as string, cancelReason || undefined);
      toast.success('Reservation cancelled');
      setShowCancelModal(false);
      fetchReservation();
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to cancel reservation'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleNoShow = async () => {
    try {
      setSubmitting(true);
      await reservationService.markNoShow(id as string);
      toast.success('Marked as no-show');
      fetchReservation();
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to mark no-show'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner /></div>;
  }

  if (!reservation) {
    return <div className="text-center py-20 text-gray-500">Reservation not found.</div>;
  }

  const status = reservation.status ?? '';
  const isTerminal = ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(status);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/reservations')} className="text-gray-500 hover:text-gray-700">
          <HiOutlineArrowLeft className="h-5 w-5" />
        </button>
        <PageHeader title={`Reservation ${reservation.reservation_number ?? id}`} />
      </div>

      {/* Details Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <HiOutlineCalendarDays className="h-5 w-5 text-blue-500" />
          Reservation Details
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          <InfoRow label="Ref Number" value={reservation.reservation_number ?? reservation.id} />
          <InfoRow label="Status" value={<StatusBadge status={status} />} />
          <InfoRow label="Customer" value={reservation.customer_name ?? reservation.customer_id} />
          <InfoRow label="Customer Phone" value={reservation.customer_phone ?? '—'} />
          <InfoRow label="Vehicle Category" value={reservation.category_name ?? '—'} />
          <InfoRow label="Assigned Vehicle" value={reservation.plate_number ? `${reservation.make ?? ''} ${reservation.model ?? ''} — ${reservation.plate_number}`.trim() : '—'} />
          <InfoRow label="Pickup Date" value={reservation.pickup_datetime ? new Date(reservation.pickup_datetime).toLocaleString() : '—'} />
          <InfoRow label="Return Date" value={reservation.return_datetime ? new Date(reservation.return_datetime).toLocaleString() : '—'} />
          <InfoRow label="Branch" value={reservation.branch_id ?? '—'} />
          <InfoRow label="Source" value={reservation.source ?? '—'} />
          <InfoRow label="Estimated Amount" value={reservation.estimated_amount ? `AED ${Number(reservation.estimated_amount).toFixed(2)}` : '—'} />
          <InfoRow label="Created" value={reservation.created_at ? new Date(reservation.created_at).toLocaleString() : '—'} />
        </div>
        {reservation.notes && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Notes</p>
            <p className="text-sm text-gray-700">{reservation.notes}</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {!isTerminal && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Actions</h2>
          <div className="flex flex-wrap gap-3">
            {status === 'PENDING' && (
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                <HiOutlineCheckCircle className="h-5 w-5" />
                {submitting ? 'Confirming...' : 'Confirm'}
              </button>
            )}
            {status === 'CONFIRMED' && (
              <button
                onClick={() => setShowAssignModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                <HiOutlineTruck className="h-5 w-5" />
                Assign Vehicle
              </button>
            )}
            <button
              onClick={() => setShowCancelModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
            >
              <HiOutlineXCircle className="h-5 w-5" />
              Cancel
            </button>
            {['PENDING', 'CONFIRMED', 'VEHICLE_ASSIGNED'].includes(status) && (
              <button
                onClick={handleNoShow}
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
              >
                <HiOutlineUserMinus className="h-5 w-5" />
                No Show
              </button>
            )}
          </div>
        </div>
      )}

      {/* Assign Vehicle Modal */}
      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title="Assign Vehicle">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Vehicle ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Vehicle UUID"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowAssignModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={handleAssignVehicle}
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Assigning...' : 'Assign'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Cancel Modal */}
      <Modal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)} title="Cancel Reservation">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Please provide a reason for cancellation (optional).</p>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            placeholder="Reason for cancellation..."
          />
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowCancelModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              Go Back
            </button>
            <button
              onClick={handleCancel}
              disabled={submitting}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? 'Cancelling...' : 'Confirm Cancel'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
