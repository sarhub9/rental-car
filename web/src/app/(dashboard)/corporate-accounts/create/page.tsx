'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiCheck, HiChevronLeft, HiChevronRight,
  HiOutlineBuildingOffice2, HiOutlineUser, HiOutlineBanknotes,
  HiClipboardDocumentCheck,
} from 'react-icons/hi2';
import { corporateAccountService } from '@/services/corporate-account.service';
import { extractApiError } from '@/lib/api-error';
import { cleanPayload } from '@/lib/clean-payload';

const STEPS = [
  { label: 'Company',  icon: HiOutlineBuildingOffice2, desc: 'Company name & contact' },
  { label: 'Contact',  icon: HiOutlineUser,            desc: 'Phone, email & billing address' },
  { label: 'Credit',   icon: HiOutlineBanknotes,       desc: 'Credit limit & payment terms' },
  { label: 'Review',   icon: HiClipboardDocumentCheck, desc: 'Confirm & create' },
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

export default function CreateCorporateAccountPage() {
  const router = useRouter();
  const [step, setStep]           = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [companyName, setCompanyName]       = useState('');
  const [contactPerson, setContactPerson]   = useState('');
  const [phone, setPhone]                   = useState('');
  const [email, setEmail]                   = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [creditLimit, setCreditLimit]       = useState('');
  const [paymentTerms, setPaymentTerms]     = useState('');

  const canNext = () => {
    if (step === 0) return !!companyName.trim();
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload: Record<string, any> = {
        company_name:       companyName.trim(),
        contact_person:     contactPerson.trim(),
        phone:              phone.trim(),
        email:              email.trim(),
        billing_address:    billingAddress.trim(),
      };
      if (creditLimit)   payload.credit_limit = Number(creditLimit);
      if (paymentTerms)  payload.payment_terms_days = Number(paymentTerms);
      await corporateAccountService.createCorporateAccount(cleanPayload(payload));
      toast.success('Corporate account created');
      router.push('/corporate-accounts');
    } catch (err: any) {
      toast.error(extractApiError(err, 'Failed to create account'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <button onClick={() => router.push('/corporate-accounts')}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
            <HiChevronLeft className="w-4 h-4" /> Back to Corporate Accounts
          </button>
          <span className="text-sm font-semibold text-gray-900">New Corporate Account</span>
          <span className="text-sm text-gray-400">Step {step + 1} of {STEPS.length}</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Step indicator */}
        <div className="flex items-start mb-8">
          {STEPS.map((s, i) => {
            const done = i < step, active = i === step;
            return (
              <div key={s.label} className="flex items-start flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-all ${
                    done   ? 'bg-blue-600 border-blue-600 text-white' :
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

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Card header */}
          <div className="px-8 pt-7 pb-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              {(() => { const Icon = STEPS[step].icon; return (
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <Icon className="w-5 h-5 text-indigo-600" />
                </div>
              ); })()}
              <div>
                <h2 className="text-lg font-bold text-gray-900">{STEPS[step].label}</h2>
                <p className="text-sm text-gray-500">{STEPS[step].desc}</p>
              </div>
            </div>
          </div>

          {/* Card body */}
          <div className="px-8 py-7 space-y-6">

            {/* Step 1 — Company */}
            {step === 0 && (
              <div className="space-y-4">
                <div>
                  <FG title="Company Details" />
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Company Name <span className="text-red-500">*</span>
                      </label>
                      <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)}
                        placeholder="e.g. Acme Corp LLC"
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact Person</label>
                      <input type="text" value={contactPerson} onChange={e => setContactPerson(e.target.value)}
                        placeholder="e.g. John Smith"
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2 — Contact */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <FG title="Contact Information" />
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                          placeholder="+971 4 xxx xxxx"
                          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                          placeholder="billing@company.com"
                          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Billing Address</label>
                      <textarea value={billingAddress} onChange={e => setBillingAddress(e.target.value)} rows={3}
                        placeholder="Company billing address..."
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none resize-none transition-all" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 — Credit */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <FG title="Credit & Payment Terms" />
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Credit Limit (AED)</label>
                      <input type="number" value={creditLimit} onChange={e => setCreditLimit(e.target.value)}
                        placeholder="e.g. 50000"
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all" />
                      <p className="text-xs text-gray-400 mt-1">Maximum credit extended to this account</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Terms (days)</label>
                      <input type="number" value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)}
                        placeholder="e.g. 30"
                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:outline-none transition-all" />
                      <p className="text-xs text-gray-400 mt-1">Number of days before invoice is due</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4 — Review */}
            {step === 3 && (
              <>
                <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-indigo-500 bg-indigo-50">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
                    <HiOutlineBuildingOffice2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{companyName}</p>
                    {contactPerson && <p className="text-xs text-indigo-600">{contactPerson}</p>}
                  </div>
                  {creditLimit && (
                    <div className="ml-auto text-right">
                      <p className="text-xs text-gray-400">Credit Limit</p>
                      <p className="font-bold text-gray-900">AED {Number(creditLimit).toLocaleString()}</p>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 rounded-xl p-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Summary</p>
                  <ReviewRow label="Company Name"    value={companyName} />
                  <ReviewRow label="Contact Person"  value={contactPerson} />
                  <ReviewRow label="Phone"           value={phone} />
                  <ReviewRow label="Email"           value={email} />
                  <ReviewRow label="Billing Address" value={billingAddress} />
                  <ReviewRow label="Credit Limit"    value={creditLimit ? `AED ${Number(creditLimit).toLocaleString()}` : undefined} />
                  <ReviewRow label="Payment Terms"   value={paymentTerms ? `${paymentTerms} days` : undefined} />
                </div>
              </>
            )}
          </div>

          {/* Card footer */}
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
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating...</>
                  : <><HiCheck className="w-4 h-4" />Create Account</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
