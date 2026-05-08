'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { vehicleService } from '@/services/vehicle.service';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { Vehicle } from '@/types';
import toast from 'react-hot-toast';
import { HiPlus, HiEye } from 'react-icons/hi2';

const STATUS_OPTIONS = ['ALL', 'AVAILABLE', 'RENTED', 'MAINTENANCE', 'OUT_OF_SERVICE'];

export default function VehiclesPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page };
      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }
      const res = await vehicleService.getVehicles(params);

      // Handle response - normalize to array
      let items: Vehicle[] = [];
      if (Array.isArray(res)) {
        items = res;
      } else if (res && Array.isArray(res.data)) {
        items = res.data;
      } else if (res && Array.isArray(res.results)) {
        items = res.results;
      }
      setVehicles(items);
      setTotalCount(items.length);
      setTotalPages(1);
    } catch {
      toast.error('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const columns = [
    { label: 'Vehicle #', render: (v: Vehicle) => v.vehicle_number },
    { label: 'Make / Model', render: (v: Vehicle) => `${v.make} ${v.model}` },
    { label: 'Year', render: (v: Vehicle) => v.year },
    { label: 'Plate', render: (v: Vehicle) => `${v.plate_number} - ${v.plate_emirate}` },
    {
      header: 'Status',
      render: (v: Vehicle) => <StatusBadge status={v.status} />,
    },
    {
      header: 'Daily Rate',
      render: (v: Vehicle) => v.daily_rate ? `AED ${Number(v.daily_rate).toFixed(2)}` : '-',
    },
    {
      header: 'Odometer',
      render: (v: Vehicle) => v.current_odometer ? `${Number(v.current_odometer).toLocaleString()} km` : '-',
    },
    {
      header: 'Actions',
      render: (v: Vehicle) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/vehicles/${v.id}`);
          }}
          className="text-blue-600 hover:text-blue-800"
        >
          <HiEye className="w-5 h-5" />
        </button>
      ),
    },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Fleet Vehicles</h1>
        <button
          onClick={() => router.push('/vehicles/create')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <HiPlus className="w-5 h-5" />
          Add Vehicle
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s === 'ALL' ? 'All Statuses' : s.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={vehicles}
        loading={loading}
        onRowClick={(vehicle: Vehicle) => router.push(`/vehicles/${vehicle.id}`)}
        emptyMessage="No vehicles found"
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-600">
            Showing page {page} of {totalPages} ({totalCount} total)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
