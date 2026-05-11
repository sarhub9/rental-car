'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { HiMagnifyingGlass, HiDocumentText } from 'react-icons/hi2';
import { invoiceService } from '@/services/invoice.service';
import { extractApiError } from '@/lib/api-error';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { Pagination } from '@/components/Pagination';
import { PageHeader } from '@/components/PageHeader';
import type { Invoice, PaginatedResponse } from '@/types';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ISSUED', label: 'Issued' },
  { value: 'PAID', label: 'Paid' },
  { value: 'PARTIALLY_PAID', label: 'Partially Paid' },
  { value: 'VOIDED', label: 'Voided' },
  { value: 'OVERDUE', label: 'Overdue' },
];

function formatAED(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `AED ${num.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = { page, page_size: 20 };
      if (statusFilter) params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;

      const response = await invoiceService.getInvoices(params);

      // Handle response - API returns array directly after our service fix
      if (Array.isArray(response)) {
        setInvoices(response);
        setTotalCount(response.length);
        setTotalPages(1);
      } else if (response.results) {
        // Fallback for paginated response
        setInvoices(response.results);
        setTotalPages(Math.ceil(response.count / 20));
        setTotalCount(response.count);
      } else {
        // Direct data
        setInvoices(response);
        setTotalCount(response.length || 0);
        setTotalPages(1);
      }
    } catch (error: any) {
      toast.error(extractApiError(error, 'Failed to load invoices'));
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, searchQuery]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, searchQuery]);

  const columns = [
    {
      header: 'Invoice #',
      render: (row: Invoice) => row.invoice_number,
    },
    {
      header: 'Agreement #',
      render: (row: Invoice) => row.agreement_number || '—',
    },
    {
      header: 'Customer',
      render: (row: Invoice) => row.customer_name || '—',
    },
    {
      header: 'Total Amount',
      render: (row: Invoice) => formatAED(row.total_amount),
    },
    {
      header: 'Amount Paid',
      render: (row: Invoice) => formatAED(row.amount_paid),
    },
    {
      header: 'Balance',
      render: (row: Invoice) => formatAED(row.balance_due),
    },
    {
      header: 'Status',
      render: (row: Invoice) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Date',
      render: (row: Invoice) =>
        row.created_at
          ? new Date(row.created_at).toLocaleDateString('en-GB')
          : '—',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        icon={<HiDocumentText className="h-6 w-6" />}
      />

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={invoices}
        loading={loading}
        onRowClick={(row: Invoice) => router.push(`/invoices/${row.id}`)}
        emptyMessage="No invoices found"
      />

      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalCount={totalCount}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
