'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiOutlineCurrencyDollar,
  HiOutlineDocumentText,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineArrowRight,
} from 'react-icons/hi2';
import { customerPortalService } from '@/services/customer-portal.service';
import { extractApiError } from '@/lib/api-error';

const STATUS_STYLES: Record<string, { badge: string; label: string }> = {
  paid:     { badge: 'bg-green-100 text-green-700', label: 'Paid' },
  partial:  { badge: 'bg-yellow-100 text-yellow-700', label: 'Partial' },
  overdue:  { badge: 'bg-red-100 text-red-700', label: 'Overdue' },
  draft:    { badge: 'bg-gray-100 text-gray-600', label: 'Draft' },
  unpaid:   { badge: 'bg-orange-100 text-orange-700', label: 'Unpaid' },
};

export default function MyInvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchInvoices();
  }, [page]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await customerPortalService.getCustomerInvoices({ page, limit: 10 });
      if (Array.isArray(res)) {
        setInvoices(res);
        setTotalPages(1);
      } else if (res?.data) {
        setInvoices(Array.isArray(res.data) ? res.data : res.data.data || []);
        setTotalPages(res.data.totalPages || res.totalPages || 1);
      } else {
        setInvoices([]);
        setTotalPages(1);
      }
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to load invoices'));
    } finally {
      setLoading(false);
    }
  };

  const statusInfo = (status: string) =>
    STATUS_STYLES[status?.toLowerCase()] || { badge: 'bg-blue-100 text-blue-700', label: status };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Invoices</h1>
        <p className="mt-1 text-sm text-gray-500">View your invoices and payment history.</p>
      </div>

      {invoices.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mx-auto">
            <HiOutlineDocumentText className="h-7 w-7 text-gray-400" />
          </div>
          <p className="mt-3 text-sm font-medium text-gray-600">No invoices found.</p>
          <p className="mt-1 text-xs text-gray-400">Your invoices will appear here once generated.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-50">
            {invoices.map((invoice) => {
              const si = statusInfo(invoice.status);
              const balanceDue = Number(invoice.balance_due || 0);
              const totalAmount = Number(invoice.total_amount || 0);
              return (
                <div
                  key={invoice.id}
                  onClick={() => router.push(`/portal/invoices/${invoice.id}`)}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                >
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <HiOutlineCurrencyDollar className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900">{invoice.invoice_number}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${si.badge}`}>
                        {si.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {invoice.issue_date || invoice.created_at
                        ? new Date(invoice.issue_date || invoice.created_at).toLocaleDateString()
                        : '—'}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-900">
                      QAR {totalAmount.toLocaleString()}
                    </p>
                    {balanceDue > 0 ? (
                      <p className="text-xs font-medium text-red-600 mt-0.5">
                        Due: QAR {balanceDue.toLocaleString()}
                      </p>
                    ) : (
                      <p className="text-xs font-medium text-green-600 mt-0.5">Paid</p>
                    )}
                  </div>
                  <HiOutlineArrowRight className="h-4 w-4 text-gray-300 flex-shrink-0 ml-1" />
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <HiOutlineChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <HiOutlineChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
