'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { vehicleService } from '@/services/vehicle.service';
import { StatusBadge } from '@/components/StatusBadge';
import { Vehicle } from '@/types';
import toast from 'react-hot-toast';
import { extractApiError } from '@/lib/api-error';
import { HiArrowLeft, HiPencilSquare, HiWrench } from 'react-icons/hi2';

const VEHICLE_STATUSES = ['AVAILABLE', 'RENTED', 'MAINTENANCE', 'OUT_OF_SERVICE'];

export default function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

  useEffect(() => {
    const fetchVehicle = async () => {
      setLoading(true);
      try {
        const res = await vehicleService.getVehicleById(id);
        setVehicle(res);
      } catch (err: any) {
        toast.error(extractApiError(err, 'Failed to load vehicle details'));
      } finally {
        setLoading(false);
      }
    };
    fetchVehicle();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!vehicle) return;
    setChangingStatus(true);
    try {
      await vehicleService.updateVehicle(vehicle.id, { status: newStatus });
      setVehicle((prev) => prev ? { ...prev, status: newStatus as Vehicle['status'] } : prev);
      toast.success(`Status changed to ${newStatus}`);
      setShowStatusMenu(false);
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to change status'));
    } finally {
      setChangingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Vehicle not found.</p>
        <button onClick={() => router.push('/vehicles')} className="mt-4 text-blue-600 hover:underline">
          Back to Vehicles
        </button>
      </div>
    );
  }

  const infoRow = (label: string, value: string | number | undefined | null) => (
    <div className="flex justify-between py-2 border-b border-gray-100">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value || '-'}</span>
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/vehicles')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <HiArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {vehicle.make} {vehicle.model} ({vehicle.year})
            </h1>
            <p className="text-sm text-gray-500">Vehicle # {vehicle.vehicle_number}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={vehicle.status} />
          <button
            onClick={() => router.push(`/vehicles/${id}/edit`)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <HiPencilSquare className="w-4 h-4" />
            Edit
          </button>
          <div className="relative">
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <HiWrench className="w-4 h-4" />
              Change Status
            </button>
            {showStatusMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                {VEHICLE_STATUSES.filter((s) => s !== vehicle.status).map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    disabled={changingStatus}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg disabled:opacity-50"
                  >
                    {status.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Vehicle Info Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Information</h2>
          {infoRow('Vehicle Number', vehicle.vehicle_number)}
          {infoRow('Make', vehicle.make)}
          {infoRow('Model', vehicle.model)}
          {infoRow('Year', vehicle.year)}
          {infoRow('Color', vehicle.color)}
          {infoRow('Chassis Number', vehicle.chassis_number)}
          {infoRow('Transmission', vehicle.transmission_type)}
          {infoRow('Fuel Type', vehicle.fuel_type)}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Registration & Rates</h2>
          {infoRow('Plate Number', vehicle.plate_number)}
          {infoRow('Plate Emirate', vehicle.plate_emirate)}
          {infoRow('Current Odometer', vehicle.current_odometer ? `${Number(vehicle.current_odometer).toLocaleString()} km` : null)}
          {infoRow('Daily Rate', vehicle.daily_rate ? `AED ${Number(vehicle.daily_rate).toFixed(2)}` : null)}
          {infoRow('Weekly Rate', vehicle.weekly_rate ? `AED ${Number(vehicle.weekly_rate).toFixed(2)}` : null)}
          {infoRow('Registration Expiry', vehicle.registration_expiry ? new Date(vehicle.registration_expiry).toLocaleDateString() : null)}
          {infoRow('Insurance Expiry', vehicle.insurance_expiry ? new Date(vehicle.insurance_expiry).toLocaleDateString() : null)}
          {infoRow('Category', vehicle.category_id)}
        </div>
      </div>

      {/* Maintenance History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Maintenance History</h2>
        {vehicle.maintenance_records && vehicle.maintenance_records.length > 0 ? (
          <div className="space-y-3">
            {(vehicle.maintenance_records as any[]).map((record: any) => (
              <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{record.description}</p>
                  <p className="text-xs text-gray-500">{new Date(record.date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">AED {Number(record.cost).toFixed(2)}</p>
                  <StatusBadge status={record.status} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No maintenance records found.</p>
        )}
      </div>

      {/* Rental History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Rental History</h2>
        {vehicle.rental_agreements && vehicle.rental_agreements.length > 0 ? (
          <div className="space-y-3">
            {(vehicle.rental_agreements as any[]).map((agreement: any) => (
              <div key={agreement.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{agreement.customer_name}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(agreement.start_date).toLocaleDateString()} - {new Date(agreement.end_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">AED {Number(agreement.total_amount).toFixed(2)}</p>
                  <StatusBadge status={agreement.status} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No rental history found.</p>
        )}
      </div>
    </div>
  );
}
