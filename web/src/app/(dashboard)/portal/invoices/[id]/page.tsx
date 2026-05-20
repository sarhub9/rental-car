'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowLeft,
  HiOutlineCurrencyDollar,
  HiOutlineDocumentText,
  HiOutlineClock,
  HiOutlineCheckCircle,
} from 'react-icons/hi2';
import { customerPortalService } from '@/services/customer-portal.service';
import { extractApiError } from '@/lib/api-error';

const STATUS_STYLES: Record<string, string> = {
  paid:    'bg-green-100 text-green-700',
  partial: 'bg-yellow-100 text-yellow-700',
  overdue: 'bg-red-100 text-red-700',
  draft:   'bg-gray-100 text-gray-600',
  unpaid:  'bg-orange-100 text-orange-700',
};

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
      setInvoice(res);
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to load invoice'));
    } finally {
      setLoading(false);
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
  const statusBadge = STATUS_STYLES[invoice.status?.toLowerCase()] || 'bg-blue-100 text-blue-700';
  const balanceDue = Number(invoice.balance_due || 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/portal/invoices')}
          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <HiOutlineArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900">{invoice.invoice_number}</h1>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge}`}>
              {invoice.status}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            Issued{' '}
            {invoice.issue_date || invoice.created_at
              ? new Date(invoice.issue_date || invoice.created_at).toLocaleDateString()
              : '—'}
          </p>
        </div>
      </div>

      {/* Invoice Meta */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <HiOutlineDocumentText className="h-4 w-4" />
          </div>
          <h2 className="text-sm font-semibold text-gray-900">Invoice Details</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Invoice #', value: invoice.invoice_number },
            { label: 'Issue Date', value: invoice.issue_date || invoice.created_at ? new Date(invoice.issue_date || invoice.created_at).toLocaleDateString() : '—' },
            { label: 'Due Date', value: invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '—' },
            { label: 'Agreement', value: invoice.agreement_number || '—' },
          ].map((item) => (
            <div key={item.label} className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-0.5">{item.label}</p>
              <p className="text-sm font-semibold text-gray-900 truncate">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Line Items + Totals */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Line Items</h2>
        {lineItems.length === 0 ? (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">No line items.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</th>
                  <th className="pb-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide w-16">Qty</th>
                  <th className="pb-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Unit Price</th>
                  <th className="pb-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item: any, idx: number) => (
                  <tr key={idx} className="border-b border-gray-50 last:border-0">
                    <td className="py-2.5 text-sm text-gray-900">{item.description}</td>
                    <td className="py-2.5 text-sm text-gray-600 text-right">{item.quantity || 1}</td>
                    <td className="py-2.5 text-sm text-gray-600 text-right">
                      QAR {Number(item.unit_price || item.rate || 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 text-sm font-medium text-gray-900 text-right">
                      QAR {Number(item.amount || item.total || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Totals */}
        <div className="mt-4 border-t border-gray-200 pt-4 space-y-2 max-w-xs ml-auto">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-medium text-gray-900">
              QAR {Number(invoice.subtotal || invoice.total_amount || 0).toLocaleString()}
            </span>
          </div>
          {invoice.vat_amount != null && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">VAT</span>
              <span className="font-medium text-gray-900">QAR {Number(invoice.vat_amount || 0).toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold border-t border-gray-100 pt-2">
            <span className="text-gray-900">Total</span>
            <span className="text-gray-900">QAR {Number(invoice.total_amount || 0).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Amount Paid</span>
            <span className="font-medium text-green-600">QAR {Number(invoice.amount_paid || 0).toLocaleString()}</span>
          </div>
          <div className={`flex justify-between text-sm font-bold border-t pt-2 ${balanceDue > 0 ? 'border-red-100' : 'border-green-100'}`}>
            <span className="text-gray-900">Balance Due</span>
            <span className={balanceDue > 0 ? 'text-red-600' : 'text-green-600'}>
              QAR {balanceDue.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
            <HiOutlineClock className="h-4 w-4" />
          </div>
          <h2 className="text-sm font-semibold text-gray-900">Payment History</h2>
        </div>
        {payments.length === 0 ? (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">No payments recorded.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {payments.map((payment: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0"
              >
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <HiOutlineCheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {payment.payment_method || payment.method || 'Payment'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {payment.payment_date || payment.created_at
                      ? new Date(payment.payment_date || payment.created_at).toLocaleString()
                      : '—'}
                    {payment.reference && ` · Ref: ${payment.reference}`}
                  </p>
                </div>
                <p className="text-sm font-bold text-green-600 flex-shrink-0">
                  QAR {Number(payment.amount || 0).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
