'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiOutlineCurrencyDollar,
  HiOutlineDocumentText,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
} from 'react-icons/hi2';
import { customerPortalService } from '@/services/customer-portal.service';

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
      setInvoices(res.data?.data || res.data || []);
      setTotalPages(res.data?.totalPages || 1);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

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
        <p className="mt-1 text-sm text-gray-500">
          View your invoices and payment history.
        </p>
      </div>

      {invoices.length === 0 ? (
        <div className="text-center py-12">
          <HiOutlineDocumentText className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-2 text-sm text-gray-500">No invoices found.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                onClick={() => router.push(`/portal/invoices/${invoice.id}`)}
                className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {invoice.invoice_number}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(invoice.created_at || invoice.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      invoice.status
                    )}`}
                  >
                    {invoice.status}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="text-sm font-bold text-gray-900">
                      QAR {Number(invoice.total_amount || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Balance Due</p>
                    <p
                      className={`text-sm font-bold ${
                        Number(invoice.balance_due || 0) > 0
                          ? 'text-red-600'
                          : 'text-green-600'
                      }`}
                    >
                      QAR {Number(invoice.balance_due || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </p>
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
