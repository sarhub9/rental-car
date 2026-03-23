'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiArrowLeft,
  HiDocumentText,
  HiCheckCircle,
  HiXCircle,
  HiCurrencyDollar,
} from 'react-icons/hi2';
import { invoiceService } from '@/services/invoice.service';
import { StatusBadge } from '@/components/StatusBadge';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import type { Invoice, InvoiceLineItem, Payment } from '@/types';

function formatAED(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `AED ${num.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'CARD', label: 'Card' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'ONLINE', label: 'Online Payment' },
];

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_method: 'CASH',
    transaction_reference: '',
    payment_date: new Date().toISOString().split('T')[0],
  });

  const [voidReason, setVoidReason] = useState('');

  const fetchInvoice = useCallback(async () => {
    try {
      setLoading(true);
      const data = await invoiceService.getInvoiceById(invoiceId);
      setInvoice(data);
    } catch (error) {
      toast.error('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  const handleIssueInvoice = async () => {
    try {
      setSubmitting(true);
      await invoiceService.issueInvoice(invoiceId);
      toast.success('Invoice issued successfully');
      fetchInvoice();
    } catch (error) {
      toast.error('Failed to issue invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    try {
      setSubmitting(true);
      await invoiceService.recordPayment(invoiceId, {
        amount: parseFloat(paymentForm.amount),
        payment_method: paymentForm.payment_method,
        transaction_reference: paymentForm.transaction_reference || '',
        payment_date: paymentForm.payment_date,
      });
      toast.success('Payment recorded successfully');
      setShowPaymentModal(false);
      setPaymentForm({
        amount: '',
        payment_method: 'CASH',
        transaction_reference: '',
        payment_date: new Date().toISOString().split('T')[0],
      });
      fetchInvoice();
    } catch (error) {
      toast.error('Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVoidInvoice = async () => {
    if (!voidReason.trim()) {
      toast.error('Please provide a reason for voiding');
      return;
    }
    try {
      setSubmitting(true);
      await invoiceService.voidInvoice(invoiceId, voidReason);
      toast.success('Invoice voided successfully');
      setShowVoidModal(false);
      setVoidReason('');
      fetchInvoice();
    } catch (error) {
      toast.error('Failed to void invoice');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Invoice not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/invoices')}>
          Back to Invoices
        </Button>
      </div>
    );
  }

  const subtotal = typeof invoice.subtotal === 'string' ? parseFloat(invoice.subtotal) : (invoice.subtotal ?? 0);
  const vatAmount = typeof invoice.vat_amount === 'string' ? parseFloat(invoice.vat_amount) : (invoice.vat_amount ?? subtotal * 0.05);
  const totalAmount = typeof invoice.total_amount === 'string' ? parseFloat(invoice.total_amount) : (invoice.total_amount ?? 0);
  const amountPaid = typeof invoice.amount_paid === 'string' ? parseFloat(invoice.amount_paid) : (invoice.amount_paid ?? 0);
  const balanceDue = typeof invoice.balance_due === 'string' ? parseFloat(invoice.balance_due) : (invoice.balance_due ?? 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/invoices')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <HiArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            Invoice {invoice.invoice_number}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {invoice.agreement_number && `Agreement: ${invoice.agreement_number}`}
            {invoice.customer_name && ` | Customer: ${invoice.customer_name}`}
          </p>
        </div>
        <StatusBadge status={invoice.status} />
      </div>

      {/* Invoice Info Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-500">Invoice Number</p>
            <p className="font-semibold">{invoice.invoice_number}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Invoice Date</p>
            <p className="font-semibold">
              {invoice.created_at
                ? new Date(invoice.created_at).toLocaleDateString('en-GB')
                : '—'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Due Date</p>
            <p className="font-semibold">
              {invoice.due_date
                ? new Date(invoice.due_date).toLocaleDateString('en-GB')
                : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {invoice.status === 'DRAFT' && (
          <Button onClick={handleIssueInvoice} disabled={submitting}>
            <HiCheckCircle className="h-4 w-4 mr-2" />
            Issue Invoice
          </Button>
        )}
        {(invoice.status === 'ISSUED' || invoice.status === 'PARTIALLY_PAID') && (
          <Button onClick={() => setShowPaymentModal(true)}>
            <HiCurrencyDollar className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        )}
        {invoice.status === 'ISSUED' && (
          <Button variant="danger" onClick={() => setShowVoidModal(true)}>
            <HiXCircle className="h-4 w-4 mr-2" />
            Void Invoice
          </Button>
        )}
      </div>

      {/* Line Items Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Line Items</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-sm font-medium text-gray-500">
                <th className="px-6 py-3">Description</th>
                <th className="px-6 py-3 text-right">Qty</th>
                <th className="px-6 py-3 text-right">Unit Price</th>
                <th className="px-6 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoice.line_items && invoice.line_items.length > 0 ? (
                invoice.line_items.map((item: InvoiceLineItem, index: number) => {
                  const qty = typeof item.quantity === 'string' ? parseFloat(item.quantity) : (item.quantity ?? 0);
                  const unitPrice = typeof item.unit_price === 'string' ? parseFloat(item.unit_price) : (item.unit_price ?? 0);
                  const lineAmount = typeof item.amount === 'string' ? parseFloat(item.amount) : (item.amount ?? qty * unitPrice);
                  return (
                    <tr key={item.id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">{item.description}</td>
                      <td className="px-6 py-4 text-sm text-right">{qty}</td>
                      <td className="px-6 py-4 text-sm text-right">{formatAED(unitPrice)}</td>
                      <td className="px-6 py-4 text-sm text-right">{formatAED(lineAmount)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                    No line items
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="border-t border-gray-200 bg-gray-50 p-6">
          <div className="max-w-xs ml-auto space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span>{formatAED(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">VAT (5%)</span>
              <span>{formatAED(vatAmount)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold border-t pt-2">
              <span>Total</span>
              <span>{formatAED(totalAmount)}</span>
            </div>
            <div className="flex justify-between text-sm text-green-600">
              <span>Amount Paid</span>
              <span>{formatAED(amountPaid)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-lg border-t pt-2">
              <span>Balance Due</span>
              <span className={balanceDue > 0 ? 'text-red-600' : 'text-green-600'}>
                {formatAED(balanceDue)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment History */}
      {invoice.payments && invoice.payments.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Payment History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left text-sm font-medium text-gray-500">
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Method</th>
                  <th className="px-6 py-3">Reference</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoice.payments.map((payment: Payment, index: number) => (
                  <tr key={payment.id || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">
                      {payment.payment_date
                        ? new Date(payment.payment_date).toLocaleDateString('en-GB')
                        : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm capitalize">
                      {payment.payment_method?.replace('_', ' ') || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {payment.transaction_reference || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium text-green-600">
                      {formatAED(payment.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Record Payment"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (AED) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max={balanceDue}
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              placeholder={`Max: ${balanceDue.toFixed(2)}`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method *
            </label>
            <select
              value={paymentForm.payment_method}
              onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transaction Reference
            </label>
            <input
              type="text"
              value={paymentForm.transaction_reference}
              onChange={(e) =>
                setPaymentForm({ ...paymentForm, transaction_reference: e.target.value })
              }
              placeholder="Optional reference number"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Date *
            </label>
            <input
              type="date"
              value={paymentForm.payment_date}
              onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowPaymentModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleRecordPayment} disabled={submitting}>
              {submitting ? 'Processing...' : 'Record Payment'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Void Invoice Modal */}
      <Modal
        isOpen={showVoidModal}
        onClose={() => setShowVoidModal(false)}
        title="Void Invoice"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to void invoice <strong>{invoice.invoice_number}</strong>?
            This action cannot be undone.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Voiding *
            </label>
            <textarea
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              rows={3}
              placeholder="Please provide a reason..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowVoidModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleVoidInvoice} disabled={submitting}>
              {submitting ? 'Voiding...' : 'Void Invoice'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
