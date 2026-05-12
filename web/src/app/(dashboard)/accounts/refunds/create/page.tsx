'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiCheck, HiChevronLeft, HiChevronRight,
  HiOutlineUser, HiOutlineBanknotes, HiClipboardDocumentCheck,
  HiMagnifyingGlass,
} from 'react-icons/hi2';
import { refundService } from '@/services/refund.service';
import { customerService } from '@/services/customer.service';
import { paymentService } from '@/services/payment.service';
import { cleanPayload } from '@/lib/clean-payload';
import { extractApiError } from '@/lib/api-error';

const STEPS = [
  { label: 'Customer', icon: HiOutlineUser,       desc: 'Find the customer' },
  { label: 'Payment',  icon: HiOutlineBanknotes,  desc: 'Select payment & amount' },
  { label: 'Review',   icon: HiClipboardDocumentCheck, desc: 'Confirm & submit' },
];

function FG({ title }: { title: string }) {
  return <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">{title}</p>;
}

function ReviewRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between py-2.5 border-b border-gray-100 last:border-0 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-900 text-right max-w-[58%]">{value}</span>
    </div>
  );
}

export default function CreateRefundPage() {
  const router = useRouter();
  const [step, setStep]           = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [customerSearch, setCustomerSearch]     = useState('');
  const [customerResults, setCustomerResults]   = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  const [payments, setPayments]           = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  // Customer search debounce
  useEffect(() => {
    if (!customerSearch.trim()) { setCustomerResults([]); return; }
    const t = setTimeout(async () => {
      setLoadingCustomers(true);
      try {
        const res = await customerService.searchCustomers(customerSearch);
        setCustomerResults(Array.isArray(res) ? res : []);
      } catch { setCustomerResults([]); }
      finally { setLoadingCustomers(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [customerSearch]);

  const handleSelectCustomer = async (c: any) => {
    setSelectedCustomer(c);
    setCustomerSearch(c.full_name_en || c.phone_number);
    setCustomerResults([]);
    setSelectedPayment(null);
    setPayments([]);
    setLoadingPayments(true);
    try {
      const res = await paymentService.getPaymentsByCustomer(c.id);
      setPayments(Array.isArray(res) ? res : []);
    } catch { setPayments([]); toast.error('Could not load payments'); }
    finally { setLoadingPayments(false); }
  };

  const canNext = () => {
    if (step === 0) return !!selectedCustomer;
    if (step === 1) return !!selectedPayment && !!amount && !!reason.trim();
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await refundService.requestRefund(cleanPayload({
        customer_id: selectedCustomer.id,
        payment_id:  selectedPayment.id,
        amount:      Number(amount),
        reason,
      }));
      toast.success('Refund requested');
      router.push('/accounts/refunds');
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to request refund'));
    } finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <button onClick={() => router.push('/accounts/refunds')}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
            <HiChevronLeft className="w-4 h-4" /> Back to Refunds
          </button>
          <span className="text-sm font-semibold text-gray-900">Request Refund</span>
          <span className="text-sm text-gray-400">Step {step + 1} of {STEPS.length}</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Steps */}
        <div className="flex items-start mb-8">
          {STEPS.map((s, i) => {
            const done = i < step, active = i === step;
            return (
              <div key={s.label} className="flex items-start flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-all ${
                    done ? 'bg-blue-600 border-blue-600 text-white' :
                    active ? 'bg-white border-blue-600 text-blue-600' :
                             'bg-white border-gray-200 text-gray-400'
                  }`}>
                    {done ? <HiCheck className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`mt-2 text-xs font-medium text-center leading-tight px-1 ${
                    active ? 'text-blue-600' : done ? 'text-gray-700' : 'text-gray-400'
                  }`}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 mt-[18px] mx-1 rounded-full"
                    style={{ background: i < step ? '#2563EB' : '#E5E7EB' }} />
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Card header */}
          <div className="px-8 pt-7 pb-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              {(() => { const Icon = STEPS[step].icon; return (
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
              ); })()}
              <div>
                <h2 className="text-lg font-bold text-gray-900">{STEPS[step].label}</h2>
                <p className="text-sm text-gray-500">{STEPS[step].desc}</p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-8 py-7 space-y-6">

            {/* Step 1 — Customer */}
            {step === 0 && (
              <div>
                <FG title="Search Customer" />
                <div className="relative">
                  <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input type="text" value={customerSearch}
                    onChange={e => { setCustomerSearch(e.target.value); setSelectedCustomer(null); }}
                    placeholder="Search by name or phone..."
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all" />
                  {(loadingCustomers || customerResults.length > 0) && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {loadingCustomers
                        ? <p className="px-4 py-3 text-sm text-gray-400">Searching...</p>
                        : customerResults.map(c => (
                          <button key={c.id} type="button"
                            onClick={() => handleSelectCustomer(c)}
                            className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-blue-50/60 text-sm">
                            <span className="font-medium text-gray-900">{c.full_name_en}</span>
                            <span className="text-xs text-gray-400">{c.phone_number}</span>
                          </button>
                        ))
                      }
                    </div>
                  )}
                </div>
                {selectedCustomer && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                      <HiOutlineUser className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{selectedCustomer.full_name_en}</p>
                      <p className="text-sm text-blue-700">{selectedCustomer.phone_number}</p>
                    </div>
                    <HiCheck className="w-5 h-5 text-blue-600 ml-auto" />
                  </div>
                )}
              </div>
            )}

            {/* Step 2 — Payment & Amount */}
            {step === 1 && (
              <>
                <div>
                  <FG title="Select Payment" />
                  {loadingPayments ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : payments.length === 0 ? (
                    <p className="text-sm text-gray-400 py-4 text-center">No payments found for this customer</p>
                  ) : (
                    <div className="space-y-2">
                      {payments.map(p => (
                        <button key={p.id} type="button"
                          onClick={() => { setSelectedPayment(p); setAmount(String(p.amount)); }}
                          className={`w-full flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all ${
                            selectedPayment?.id === p.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}>
                          <div>
                            <p className="font-semibold text-gray-900 font-mono text-sm">{p.payment_number}</p>
                            <p className="text-xs text-gray-500 capitalize mt-0.5">{(p.payment_method || '').replace(/_/g, ' ')} · {p.created_at ? new Date(p.created_at).toLocaleDateString() : ''}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900">AED {Number(p.amount).toLocaleString()}</p>
                            {selectedPayment?.id === p.id && <HiCheck className="w-4 h-4 text-blue-600 ml-auto mt-1" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {selectedPayment && (
                  <div>
                    <FG title="Refund Details" />
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Amount (AED) <span className="text-red-500">*</span>
                        </label>
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                          max={selectedPayment?.amount} placeholder="0.00"
                          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all" />
                        <p className="text-xs text-gray-400 mt-1">Max: AED {Number(selectedPayment?.amount || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Reason <span className="text-red-500">*</span>
                        </label>
                        <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
                          placeholder="Reason for refund..."
                          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all resize-none" />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Step 3 — Review */}
            {step === 2 && (
              <>
                <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-blue-500 bg-blue-50">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                    <HiOutlineBanknotes className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Refund Request</p>
                    <p className="text-xs text-gray-500">{selectedCustomer?.full_name_en}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-lg font-bold text-gray-900">AED {Number(amount).toLocaleString()}</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Summary</p>
                  <ReviewRow label="Customer"   value={selectedCustomer?.full_name_en} />
                  <ReviewRow label="Phone"      value={selectedCustomer?.phone_number} />
                  <ReviewRow label="Payment"    value={selectedPayment?.payment_number} />
                  <ReviewRow label="Amount"     value={`AED ${Number(amount).toLocaleString()}`} />
                  <ReviewRow label="Reason"     value={reason} />
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/60 flex items-center justify-between">
            <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all">
              <HiChevronLeft className="w-4 h-4" /> Back
            </button>
            <span className="text-xs text-gray-400 font-medium">{step + 1} / {STEPS.length}</span>
            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all">
                Continue <HiChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all">
                {submitting
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting...</>
                  : <><HiCheck className="w-4 h-4" />Submit Request</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
