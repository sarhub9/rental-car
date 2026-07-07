'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiCheck, HiChevronLeft, HiChevronRight, HiChevronDown,
  HiOutlineBanknotes, HiOutlineDocumentText, HiClipboardDocumentCheck,
} from 'react-icons/hi2';
import { expenseService } from '@/services/expense.service';
import { cleanPayload } from '@/lib/clean-payload';
import { extractApiError } from '@/lib/api-error';

const CATEGORIES = [
  'VEHICLE_MAINTENANCE', 'INSURANCE', 'REGISTRATION', 'FUEL', 'RENT',
  'SALARY', 'UTILITIES', 'MARKETING', 'SALIK_RECHARGE', 'REPAIR', 'OFFICE', 'BANK_CHARGES', 'OTHER',
];
const PAYMENT_METHODS = ['CASH', 'BANK_TRANSFER', 'CARD', 'CHEQUE', 'OTHER'];

const STEPS = [
  { label: 'Details',  icon: HiOutlineBanknotes,      desc: 'Category, date & description' },
  { label: 'Amounts',  icon: HiOutlineDocumentText,    desc: 'Amount, VAT & payment method' },
  { label: 'Review',   icon: HiClipboardDocumentCheck, desc: 'Confirm & save' },
];

const emptyForm = {
  category: 'OTHER',
  description: '',
  expense_date: new Date().toISOString().split('T')[0],
  amount: '',
  vat_amount: '0',
  payment_method: 'CASH',
  vendor_name: '',
  reference_number: '',
  notes: '',
};

function FG({ title }: { title: string }) {
  return <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">{title}</p>;
}

function F({ label, name, value, onChange, type = 'text', required = false, placeholder = '' }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder}
        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all" />
    </div>
  );
}

function SelectF({ label, name, value, onChange, options, required = false }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <select name={name} value={value} onChange={onChange}
          className="w-full px-3.5 py-2.5 pr-9 border border-gray-300 rounded-lg text-sm bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all appearance-none">
          {options.map((o: string) => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
        </select>
        <HiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
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

export default function CreateExpensePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);

  const set = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const canNext = () => {
    if (step === 0) return !!form.description.trim() && !!form.expense_date;
    if (step === 1) return !!form.amount;
    return true;
  };

  const total = (Number(form.amount) || 0) + (Number(form.vat_amount) || 0);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
        vat_amount: Number(form.vat_amount || 0),
        total_amount: total,
      };
      await expenseService.create(cleanPayload(payload));
      toast.success('Expense recorded');
      router.push('/expenses');
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to record expense'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <button onClick={() => router.push('/expenses')}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
            <HiChevronLeft className="w-4 h-4" /> Back to Expenses
          </button>
          <span className="text-sm font-semibold text-gray-900">Add Expense</span>
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
          <div className="px-8 py-7 space-y-7">

            {/* Step 1 — Details */}
            {step === 0 && (
              <>
                <div>
                  <FG title="Expense Info" />
                  <div className="grid grid-cols-2 gap-4">
                    <SelectF label="Category" name="category" value={form.category} onChange={set} options={CATEGORIES} required />
                    <F label="Expense Date" name="expense_date" value={form.expense_date} onChange={set} type="date" required />
                    <div className="col-span-2">
                      <F label="Description" name="description" value={form.description} onChange={set} required placeholder="Describe the expense..." />
                    </div>
                    <div className="col-span-2">
                      <F label="Vendor / Supplier" name="vendor_name" value={form.vendor_name} onChange={set} placeholder="Vendor or supplier name" />
                    </div>
                  </div>
                </div>
                <div>
                  <FG title="Reference" />
                  <F label="Receipt / Invoice #" name="reference_number" value={form.reference_number} onChange={set} placeholder="Invoice or receipt number" />
                </div>
              </>
            )}

            {/* Step 2 — Amounts */}
            {step === 1 && (
              <>
                <div>
                  <FG title="Amount" />
                  <div className="grid grid-cols-2 gap-4">
                    <F label="Amount (AED)" name="amount" value={form.amount} onChange={set} type="number" required placeholder="0.00" />
                    <F label="VAT Amount (AED)" name="vat_amount" value={form.vat_amount} onChange={set} type="number" placeholder="0.00" />
                  </div>
                  {(Number(form.amount) > 0) && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Subtotal</span>
                        <span className="font-medium">AED {Number(form.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-gray-500">VAT</span>
                        <span className="font-medium">AED {Number(form.vat_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold mt-2 pt-2 border-t border-gray-200">
                        <span>Total</span>
                        <span>AED {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <FG title="Payment Method" />
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {PAYMENT_METHODS.map(m => (
                      <button key={m} type="button"
                        onClick={() => setForm(p => ({ ...p, payment_method: m }))}
                        className={`py-2.5 px-2 rounded-xl border-2 text-xs font-semibold text-center transition-all ${
                          form.payment_method === m
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                        }`}>
                        {m.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <FG title="Notes" />
                  <textarea name="notes" value={form.notes} onChange={set} rows={3}
                    placeholder="Additional notes..."
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all resize-none" />
                </div>
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
                    <p className="font-bold text-gray-900">{form.category.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-gray-500">{form.expense_date}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-lg font-bold text-gray-900">AED {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    <p className="text-xs text-gray-400">Total incl. VAT</p>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-5">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Details</p>
                    <ReviewRow label="Description" value={form.description} />
                    <ReviewRow label="Vendor" value={form.vendor_name} />
                    <ReviewRow label="Reference" value={form.reference_number} />
                    <ReviewRow label="Payment" value={form.payment_method.replace(/_/g, ' ')} />
                  </div>
                  <div className="bg-gray-50 rounded-xl p-5">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Amounts</p>
                    <ReviewRow label="Amount" value={`AED ${Number(form.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
                    <ReviewRow label="VAT" value={`AED ${Number(form.vat_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
                    <ReviewRow label="Total" value={`AED ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
                    {form.notes && <ReviewRow label="Notes" value={form.notes} />}
                  </div>
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
              <button onClick={handleSubmit} disabled={submitting || !form.amount}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all">
                {submitting
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
                  : <><HiCheck className="w-4 h-4" />Save Expense</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
