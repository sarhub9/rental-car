'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowLeft,
  HiOutlineCurrencyDollar,
  HiOutlineDocumentText,
  HiOutlineClock,
} from 'react-icons/hi2';
import { customerPortalService } from '@/services/customer-portal.service';
import { extractApiError } from '@/lib/api-error';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const res = await customerPortalService.getCustomerInvoiceById(id);
      setInvoice(res.data);
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to load invoice'));
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

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500">Invoice not found.</p>
        <button
          onClick={() => router.push('/portal/invoices')}
          className="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Back to Invoices
        </button>
      </div>
    );
  }

  const lineItems = invoice.line_items || invoice.items || [];
  const payments = invoice.payments || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/portal/invoices')}
          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
        >
          <HiOutlineArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {invoice.invoice_number}
            </h1>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                invoice.status
              )}`}
            >
              {invoice.status}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            Issued on{' '}
            {new Date(invoice.created_at || invoice.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Invoice Info */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <HiOutlineDocumentText className="h-4 w-4" />
          Invoice Details
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500">Invoice #</p>
            <p className="text-sm font-medium text-gray-900">
              {invoice.invoice_number}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Date</p>
            <p className="text-sm font-medium text-gray-900">
              {new Date(invoice.created_at || invoice.created_at).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Due Date</p>
            <p className="text-sm font-medium text-gray-900">
              {invoice.due_date
                ? new Date(invoice.due_date).toLocaleDateString()
                : '-'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Agreement</p>
            <p className="text-sm font-medium text-gray-900">
              {invoice.agreement_number || '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
          Line Items
        </h2>
        {lineItems.length === 0 ? (
          <p className="text-sm text-gray-500">No line items.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Description
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    Qty
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    Unit Price
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lineItems.map((item: any, idx: number) => (
                  <tr key={idx}>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {item.description}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600 text-right">
                      {item.quantity || 1}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600 text-right">
                      QAR {Number(item.unit_price || item.rate || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                      QAR {Number(item.amount || item.total || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Totals */}
        <div className="mt-4 border-t border-gray-200 pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="text-gray-900 font-medium">
              QAR {Number(invoice.subtotal || invoice.total_amount || 0).toLocaleString()}
            </span>
          </div>
          {invoice.vat_amount != null && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">VAT</span>
              <span className="text-gray-900 font-medium">
                QAR {Number(invoice.vat_amount || 0).toLocaleString()}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-2">
            <span className="text-gray-900">Total</span>
            <span className="text-gray-900">
              QAR {Number(invoice.total_amount || 0).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Amount Paid</span>
            <span className="text-green-600 font-medium">
              QAR {Number(invoice.amount_paid || 0).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-2">
            <span className="text-gray-900">Balance Due</span>
            <span
              className={
                Number(invoice.balance_due || 0) > 0
                  ? 'text-red-600'
                  : 'text-green-600'
              }
            >
              QAR {Number(invoice.balance_due || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <HiOutlineClock className="h-4 w-4" />
          Payment History
        </h2>
        {payments.length === 0 ? (
          <p className="text-sm text-gray-500">No payments recorded.</p>
        ) : (
          <div className="space-y-3">
            {payments.map((payment: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {payment.payment_method || payment.method || 'Payment'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(payment.payment_date || payment.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-green-600">
                    QAR {Number(payment.amount || 0).toLocaleString()}
                  </p>
                  {payment.reference && (
                    <p className="text-xs text-gray-400">Ref: {payment.reference}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
