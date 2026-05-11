'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowLeft,
  HiOutlineExclamationTriangle,
  HiOutlinePencilSquare,
  HiOutlinePhoto,
  HiOutlineChevronDown,
} from 'react-icons/hi2';
import { incidentService } from '@/services/incident.service';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { Modal } from '@/components/Modal';
import { Spinner } from '@/components/Spinner';
import { extractApiError } from '@/lib/api-error';

const STATUS_OPTIONS = ['OPEN', 'UNDER_REVIEW', 'CLAIMED', 'SETTLED', 'CLOSED', 'REJECTED'];

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <div className="text-sm font-medium text-gray-900 mt-0.5">{value ?? '—'}</div>
    </div>
  );
}

export default function IncidentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [incident, setIncident] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [updateNotes, setUpdateNotes] = useState('');

  const fetchIncident = useCallback(async () => {
    try {
      setLoading(true);
      const [incRes, photosRes] = await Promise.allSettled([
        incidentService.getIncidentById(id as string),
        incidentService.getIncidentPhotos(id as string),
      ]);
      if (incRes.status === 'fulfilled') {
        const data = incRes.value?.data ?? incRes.value;
        setIncident(data);
        setNewStatus(data?.status ?? 'OPEN');
      }
      if (photosRes.status === 'fulfilled') {
        const data = photosRes.value;
        setPhotos(Array.isArray(data) ? data : (data?.data || []));
      }
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to load incident'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchIncident(); }, [fetchIncident]);

  const handleUpdate = async () => {
    try {
      setSubmitting(true);
      const payload: Record<string, any> = { status: newStatus };
      if (updateNotes.trim()) payload.notes = updateNotes;
      await incidentService.updateIncident(id as string, payload);
      toast.success('Incident updated');
      setShowUpdateModal(false);
      fetchIncident();
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to update incident'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner /></div>;
  }

  if (!incident) {
    return <div className="text-center py-20 text-gray-500">Incident not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/incidents')} className="text-gray-500 hover:text-gray-700">
            <HiOutlineArrowLeft className="h-5 w-5" />
          </button>
          <PageHeader title={`Incident ${incident.incident_number ?? id}`} />
        </div>
        {incident.status !== 'CLOSED' && (
          <button
            onClick={() => { setNewStatus(incident.status); setUpdateNotes(''); setShowUpdateModal(true); }}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            <HiOutlinePencilSquare className="h-4 w-4" />
            Update Status
          </button>
        )}
      </div>

      {/* Incident Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <HiOutlineExclamationTriangle className="h-5 w-5 text-red-500" />
          Incident Details
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          <InfoRow label="Incident #" value={incident.incident_number ?? incident.id} />
          <InfoRow label="Status" value={<StatusBadge status={incident.status} />} />
          <InfoRow label="Type" value={<span className="capitalize">{(incident.incident_type ?? '').replace(/_/g, ' ')}</span>} />
          <InfoRow label="Vehicle" value={incident.vehicle?.plate_number ?? incident.plate_number ?? incident.vehicle_id} />
          <InfoRow label="Customer" value={incident.customer?.full_name ?? incident.customer_id?.slice(0, 8) ?? '—'} />
          <InfoRow label="Agreement" value={incident.agreement?.agreement_number ?? incident.agreement_id?.slice(0, 8) ?? '—'} />
          <InfoRow
            label="Incident Date"
            value={incident.incident_datetime ? new Date(incident.incident_datetime).toLocaleString() : '—'}
          />
          <InfoRow label="Location" value={incident.location} />
          <InfoRow label="Police Report #" value={incident.police_report_number} />
          <InfoRow label="Created" value={incident.created_at ? new Date(incident.created_at).toLocaleString() : '—'} />
        </div>
        {incident.description && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Description</p>
            <p className="text-sm text-gray-700">{incident.description}</p>
          </div>
        )}
        {incident.notes && (
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-1">Notes</p>
            <p className="text-sm text-gray-700">{incident.notes}</p>
          </div>
        )}
      </div>

      {/* Photos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <HiOutlinePhoto className="h-5 w-5 text-gray-500" />
          Photos ({photos.length})
        </h2>
        {photos.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <HiOutlinePhoto className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No photos attached to this incident.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {photos.map((photo: any, i: number) => (
              <a
                key={photo.id ?? i}
                href={photo.photo_url ?? photo.url ?? photo.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block aspect-square rounded-lg overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity"
              >
                <img
                  src={photo.photo_url ?? photo.url ?? photo.file_url}
                  alt={`Incident photo ${i + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-image.png';
                  }}
                />
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Update Status Modal */}
      <Modal isOpen={showUpdateModal} onClose={() => setShowUpdateModal(false)} title="Update Incident">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Status</label>
            <div className="relative">
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="appearance-none w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <HiOutlineChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Notes (optional)</label>
            <textarea
              value={updateNotes}
              onChange={(e) => setUpdateNotes(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder="Add notes about this update..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowUpdateModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
            <button
              onClick={handleUpdate}
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {submitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {submitting ? 'Saving...' : 'Save Update'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
