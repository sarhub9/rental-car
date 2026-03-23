'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  HiPlus,
  HiMagnifyingGlass,
  HiFunnel,
  HiChevronLeft,
  HiChevronRight,
} from 'react-icons/hi2';
import { agreementService } from '@/services/agreement.service';
import { StatusBadge } from '@/components/StatusBadge';
import { DataTable } from '@/components/DataTable';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { SearchInput } from '@/components/SearchInput';
import type { Agreement } from '@/types';

const STATUS_OPTIONS = [
  { label: 'All Statuses', value: '' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Closed', value: 'CLOSED' },
];

export default function AgreementsPage() {
  const router = useRouter();
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  const fetchAgreements = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {
        page,
        limit,
      };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const response = await agreementService.getAgreements(params);
      setAgreements(response.data || []);
      setTotalPages(response.totalPages || 1);
      setTotalCount(response.total || 0);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load agreements');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchAgreements();
  }, [fetchAgreements]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const columns = [
    {
      key: 'agreement_number',
      label: 'Agreement #',
      render: (row: Agreement) => (
        <span className="font-semibold text-blue-600">
          {row.agreement_number || `AGR-${String(row.id).padStart(5, '0')}`}
        </span>
      ),
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (row: Agreement) =>
        row.customer
          ? `${row.customer.full_name_en} ${row.customer.full_name_ar}`
          : '-',
    },
    {
      key: 'vehicle',
      label: 'Vehicle',
      render: (row: Agreement) =>
        row.vehicle
          ? `${row.vehicle.year} ${row.vehicle.make} ${row.vehicle.model}`
          : '-',
    },
    {
      key: 'rental_start_datetime',
      label: 'Start Date',
      render: (row: Agreement) =>
        row.rental_start_datetime
          ? new Date(row.rental_start_datetime).toLocaleDateString()
          : '-',
    },
    {
      key: 'rental_end_datetime',
      label: 'End Date',
      render: (row: Agreement) =>
        row.rental_end_datetime
          ? new Date(row.rental_end_datetime).toLocaleDateString()
          : '-',
    },
    {
      key: 'estimated_amount',
      label: 'Amount',
      render: (row: Agreement) =>
        row.estimated_amount != null
          ? `$${Number(row.estimated_amount).toFixed(2)}`
          : '-',
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: Agreement) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agreements</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage rental agreements and contracts
          </p>
        </div>
        <Link
          href="/agreements/create"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          <HiPlus className="h-5 w-5" />
          New Agreement
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search agreements..."
          />
        </div>
        <div className="relative">
          <HiFunnel className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-10 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner />
          </div>
        ) : agreements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <HiMagnifyingGlass className="h-12 w-12 mb-3 text-gray-300" />
            <p className="text-lg font-medium">No agreements found</p>
            <p className="text-sm mt-1">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={agreements}
            onRowClick={(row: Agreement) =>
              router.push(`/agreements/${row.id}`)
            }
          />
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {(page - 1) * limit + 1} to{' '}
            {Math.min(page * limit, totalCount)} of {totalCount} agreements
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <HiChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <HiChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
