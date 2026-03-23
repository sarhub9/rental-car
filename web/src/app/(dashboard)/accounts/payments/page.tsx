'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { HiOutlineFunnel, HiOutlineBanknotes } from 'react-icons/hi2';
import { invoiceService } from '@/services/invoice.service';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { Spinner } from '@/components/Spinner';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [methodFilter, setMethodFilter] = useState('ALL');

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (methodFilter !== 'ALL') params.method = methodFilter;

      const res = await invoiceService.getInvoices(params);
      const invoices = res.data ?? res;
      setPayments(Array.isArray(invoices) ? invoices : []);
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [methodFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const columns = [
    {
      key: 'payment_number',
      label: 'Payment #',
      render: (_: any, row: any) => row.payment_number ?? row.id ?? 'N/A',
    },
    {
      key: 'invoice_number',
      label: 'Invoice #',
      render: (_: any, row: any) => row.invoice_number ?? row.invoice_id ?? 'N/A',
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (_: any, row: any) => `AED ${Number(row.amount ?? 0).toLocaleString()}`,
    },
    {
      key: 'method',
      label: 'Method',
      render: (_: any, row: any) => (
        <span className="capitalize text-sm">
          {(row.method ?? row.payment_method ?? 'N/A').replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_: any, row: any) => <StatusBadge status={row.status} />,
    },
    {
      key: 'reference',
      label: 'Reference',
      render: (_: any, row: any) => row.reference ?? row.transaction_ref ?? '-',
    },
    {
      key: 'created_at',
      label: 'Date',
      render: (_: any, row: any) =>
        row.created_at ? new Date(row.created_at).toLocaleDateString() : 'N/A',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" />

      {/* Filter */}
      <div className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
        <HiOutlineFunnel className="h-5 w-5 text-gray-400" />
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Payment Method</label>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="ALL">All Methods</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="cheque">Cheque</option>
            <option value="online">Online</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <DataTable columns={columns} data={payments} emptyMessage="No payments found." />
      )}
    </div>
  );
}
